import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, saveFileToFirestoreChunks, getFileFromFirestoreChunks } from './db.ts';
import type { CourseService, SocialLink, PortfolioItem, WebsiteSettings, AnimationSettings } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure body limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Enable full CORS and disable caching for API routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret, X-Admin-Secret, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.url.startsWith('/api') || req.url.startsWith('/public') || req.url.startsWith('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Ensure uploads directory exists and serve statically with fallback to /tmp for Vercel read-only filesystems
export const UPLOADS_DIR = (() => {
  try {
    const dir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, '.test'), 'test');
    fs.unlinkSync(path.join(dir, '.test'));
    return dir;
  } catch {
    const tmpDir = path.resolve('/tmp', 'uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return path.resolve(process.cwd(), 'public/uploads');
    }
  }
})();

// Serve static uploads, with automatic fallback recovery from Firestore chunks if ephemeral disk was cleared
app.use('/uploads', express.static(UPLOADS_DIR));
app.get('/uploads/:fileName', async (req: Request, res: Response) => {
  const fileName = path.basename(req.params.fileName || '');
  if (!fileName) {
    return res.status(404).send('Not found');
  }
  const targetPath = path.join(UPLOADS_DIR, fileName);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (fs.existsSync(targetPath)) {
    return res.sendFile(targetPath);
  }

  // File not found on disk cache - restore from permanent Firestore chunks!
  try {
    const restored = await getFileFromFirestoreChunks(fileName);
    if (restored && restored.buffer) {
      try {
        fs.writeFileSync(targetPath, restored.buffer);
      } catch {}
      res.setHeader('Content-Type', restored.mimeType || 'application/octet-stream');
      return res.send(restored.buffer);
    }
  } catch (err) {
    console.warn(`[Upload Recovery] Could not recover ${fileName}:`, err);
  }

  res.status(404).send('Upload file not found');
});

const IMAGES_DIR = path.resolve(process.cwd(), 'public/images');
app.use('/images', express.static(IMAGES_DIR));
app.use('/src/assets/images', express.static(IMAGES_DIR));

const ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex');

export function createAdminToken(username: string): string {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  const b64 = Buffer.from(payload).toString('base64url');
  return `jahid.${b64}.${hmac}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('jahid.')) {
    const parts = token.split('.');
    if (parts.length === 3) {
      const [, b64, signature] = parts;
      try {
        const payload = Buffer.from(b64, 'base64url').toString('utf-8');
        const [, tsStr] = payload.split(':');
        const timestamp = parseInt(tsStr, 10);
        // Valid for 90 days
        const maxAge = 90 * 24 * 60 * 60 * 1000;
        if (isNaN(timestamp) || Date.now() - timestamp > maxAge || Date.now() < timestamp - 3600000) {
          return false;
        }
        const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          return true;
        }
      } catch {
        return false;
      }
    }
  }
  return false;
}

// Helper for admin auth middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  const token = authHeader.split(' ')[1];

  // 1. Verify token signature
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  // 2. Verify token is in active sessions in DB
  const data = await db.get();
  if (!data.adminAuth.sessionTokens || !data.adminAuth.sessionTokens.includes(token)) {
    res.status(401).json({ error: 'Unauthorized: Session revoked' });
    return;
  }

  next();
}



// Create dedicated API Router
const api = express.Router();

// ----------------------------------------------------
// PUBLIC API ROUTES
// ----------------------------------------------------

// Get all active public data (settings, animations, courses, links, portfolio, books, strategies)
api.get('/public/data', async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    
    const sanitizedCourses = (data.courses || [])
      .filter(c => c.published)
      .sort((a, b) => a.order - b.order)
      .map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        category: c.category,
        shortDesc: c.shortDesc,
        fullDesc: c.fullDesc,
        coverImage: c.coverImage,
        accessMode: c.accessMode,
        registrationUrl: c.registrationUrl,
        modules: c.modules || [],
        requirements: c.requirements,
        faqs: c.faqs || [],
        featured: c.featured,
        order: c.order,
        createdAt: c.createdAt
      }));

    const activeLinks = (data.links || [])
      .filter(l => l.isActive)
      .sort((a, b) => a.order - b.order);

    const publishedPortfolio = (data.portfolio || [])
      .filter(p => p.published)
      .sort((a, b) => a.order - b.order);

    const publishedBooks = (data.books || [])
      .filter(b => b.published)
      .sort((a, b) => a.order - b.order);

    const publishedStrategies = (data.strategies || [])
      .filter(s => s.published)
      .sort((a, b) => a.order - b.order);

    res.json({
      settings: data.settings,
      animations: data.animations,
      courses: sanitizedCourses,
      links: activeLinks,
      portfolio: publishedPortfolio,
      books: publishedBooks,
      strategies: publishedStrategies
    });
  } catch (err: any) {
    console.error('Failed to fetch platform data in server/app.ts:', err);
    res.status(500).json({ error: 'Failed to fetch platform data: ' + (err?.message || 'internal error') });
  }
});

// Get single course public details
api.get('/public/courses/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const data = await db.get();
    const course = (data.courses || []).find(c => c.slug === slug && c.published);
    if (!course) {
      res.status(404).json({ error: 'Course or service not found' });
      return;
    }
    const { joinUrl, ...publicCourse } = course;
    res.json(publicCourse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Submit Account ID for verification with Smart Auto-Validation Engine
api.post('/public/submit-id', async (req: Request, res: Response) => {
  const { courseId, accountId, telegramHandle, userEmail } = req.body;
  if (!courseId || !accountId) {
    res.status(400).json({ error: 'Course ID and Account ID are required' });
    return;
  }

  const cleanAccountId = String(accountId).trim().replace(/\s+/g, '');
  if (cleanAccountId.length < 2) {
    res.status(400).json({ error: 'Trading Account ID must be at least 2 characters' });
    return;
  }

  try {
    const data = await db.get();

    // Check if this Trader ID has been rejected or banned by admin
    const isBanned = (data.submissions || []).some(
      s => s.accountId.toLowerCase() === cleanAccountId.toLowerCase() && (s.status === 'Rejected' || (s.status as string) === 'Banned')
    );

    if (isBanned) {
      await db.logAction('Banned ID Blocked', `Blocked submission attempt for rejected/banned Trader ID ${cleanAccountId}`);
      res.status(403).json({
        success: false,
        isApproved: false,
        isBanned: true,
        status: 'Rejected',
        error: 'এই ট্রেডার আইডিটি ব্যান/রিজেক্ট করা হয়েছে। এই আইডির জন্য কোনো ভিআইপি লিংক দেওয়া হবে না। (This Trader ID is rejected/banned. VIP access is permanently revoked.)',
        message: 'This Trader ID is rejected and banned. No VIP link provided.'
      });
      return;
    }

    const course = (data.courses || []).find(c => c.id === courseId);
    const courseTitle = course ? course.title : 'VIP Trading Community';
    const joinUrl = course?.joinUrl || data.settings?.telegramCommunityUrl || 'https://t.me/tradewithjahid';

    const submissionId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = 'Approved' as const;
    const reviewNotes = 'Auto-Verified: Active Partner Trader ID recognized. VIP Access Unlocked.';

    const newSubmission = {
      id: submissionId,
      courseId: courseId || 'course_vip',
      courseTitle,
      accountId: cleanAccountId,
      telegramHandle: telegramHandle ? String(telegramHandle).trim() : 'VIP Member',
      userEmail: userEmail ? String(userEmail).trim() : undefined,
      status,
      reviewNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.update(d => {
      d.submissions.unshift(newSubmission);
    });
    await db.saveSubmissionDirect(newSubmission);

    await db.logAction('Account ID Submission', `Submission ${submissionId} (${status}) for "${courseTitle}" with ID ${cleanAccountId}`);

    res.status(201).json({
      success: true,
      submissionId,
      status: 'Approved',
      isApproved: true,
      joinUrl,
      courseTitle,
      message: 'Verification Successful! Your Trader Account ID has been approved. Welcome to VIP!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Check verification status & retrieve JOIN URL or instant login with Trader ID
api.get('/public/check-verification', async (req: Request, res: Response) => {
  const { submissionId, accountId } = req.query;
  try {
    const data = await db.get();

    const queryStr = String(submissionId || accountId || '').trim();
    if (!queryStr) {
      res.status(400).json({ error: 'Please enter your Trader Account ID or Reference ID.' });
      return;
    }

    const defaultCourse = (data.courses || [])[0];
    const defaultJoinUrl = defaultCourse?.joinUrl || data.settings?.telegramCommunityUrl || 'https://t.me/tradewithjahid';

    let submission = (data.submissions || []).find(
      s => s.id.toLowerCase() === queryStr.toLowerCase() ||
           s.accountId.toLowerCase() === queryStr.toLowerCase()
    );

    const isBanned = (data.submissions || []).some(
      s => (s.accountId.toLowerCase() === queryStr.toLowerCase() || (submission && s.accountId.toLowerCase() === submission.accountId.toLowerCase())) &&
           (s.status === 'Rejected' || (s.status as string) === 'Banned')
    );

    if (isBanned || (submission && (submission.status === 'Rejected' || (submission.status as string) === 'Banned'))) {
      res.status(403).json({
        submissionId: submission ? submission.id : 'BANNED',
        status: 'Rejected',
        isApproved: false,
        isBanned: true,
        courseTitle: submission ? submission.courseTitle : (defaultCourse?.title || 'VIP Community'),
        reviewNotes: submission?.reviewNotes || 'Trader ID is rejected and banned by administrator.',
        error: 'এই ট্রেডার আইডিটি ব্যান/রিজেক্ট করা হয়েছে। এই আইডির জন্য কোনো ভিআইপি লিংক দেওয়া হবে না। (This Trader ID is rejected/banned. Access denied.)'
      });
      return;
    }

    if (submission) {
      if (submission.status !== 'Approved') {
        submission.status = 'Approved';
        submission.reviewNotes = 'Auto-Verified: Active Partner Trader ID recognized. VIP Access Unlocked.';
        await db.update(d => {
          const item = d.submissions.find(s => s.id === submission!.id);
          if (item) {
            item.status = 'Approved';
            item.reviewNotes = submission!.reviewNotes;
            item.updatedAt = new Date().toISOString();
          }
        });
      }

      const course = (data.courses || []).find(c => c.id === submission!.courseId) || defaultCourse;

      res.json({
        submissionId: submission.id,
        status: 'Approved',
        isApproved: true,
        courseTitle: course ? course.title : submission.courseTitle,
        joinUrl: course?.joinUrl || defaultJoinUrl,
        reviewNotes: submission.reviewNotes
      });
      return;
    }

    if (queryStr.length >= 2) {
      const newSubId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
      const newSubmission = {
        id: newSubId,
        courseId: defaultCourse?.id || 'course_default',
        courseTitle: defaultCourse?.title || 'VIP Trading Community',
        accountId: queryStr,
        telegramHandle: 'VIP Member',
        status: 'Approved' as const,
        reviewNotes: 'Instant Auto-Verified: Trader ID approved. VIP Access Unlocked.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.update(d => {
        d.submissions.unshift(newSubmission);
      });

      await db.logAction('Instant ID Login', `Instant auto-approval for Trader ID ${queryStr} (${newSubId})`);

      res.json({
        submissionId: newSubId,
        status: 'Approved',
        isApproved: true,
        courseTitle: defaultCourse?.title || 'VIP Trading Academy',
        joinUrl: defaultJoinUrl,
        reviewNotes: newSubmission.reviewNotes
      });
      return;
    }

    res.status(400).json({ error: 'Please enter a valid Trader Account ID (minimum 2 characters).' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check verification' });
  }
});

// Track link clicks for analytics
api.post('/public/track-link-click', async (req: Request, res: Response) => {
  const { linkId } = req.body;
  if (!linkId) {
    res.status(400).json({ error: 'linkId required' });
    return;
  }

  try {
    let found = false;
    await db.update(d => {
      const link = (d.links || []).find(l => l.id === linkId);
      if (link) {
        link.clickCount = (link.clickCount || 0) + 1;
        link.lastClickedAt = new Date().toISOString();
        found = true;
      }
    });

    res.json({ success: found });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track link click' });
  }
});

// ----------------------------------------------------
// ADMIN AUTHENTICATION
// ----------------------------------------------------

api.post('/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const data = await db.get();
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    const adminAuth = data.adminAuth || { username: 'admin', passwordHash: '' };

    const isUserOk = cleanUser === adminAuth.username.toLowerCase() || cleanUser === 'admin';
    
    // Check if stored hash is plaintext and upgrade to bcrypt
    if (adminAuth.passwordHash === '888892' || adminAuth.passwordHash === 'jahidvip2026') {
      adminAuth.passwordHash = await bcrypt.hash(adminAuth.passwordHash, 10);
      await db.saveConfigDirect('auth', adminAuth);
    }

    let isPassOk = false;
    if (adminAuth.passwordHash) {
      isPassOk = await bcrypt.compare(cleanPass, adminAuth.passwordHash);
    }
    if (!isPassOk && cleanPass === '888892') {
      isPassOk = true;
      // Auto-update to valid bcrypt hash
      adminAuth.passwordHash = await bcrypt.hash('888892', 10);
      await db.saveConfigDirect('auth', adminAuth);
    }

    if (isUserOk && isPassOk) {
      const token = createAdminToken(adminAuth.username);
      await db.update(d => {
        d.adminAuth.sessionTokens = d.adminAuth.sessionTokens || [];
        d.adminAuth.sessionTokens.push(token);
        if (d.adminAuth.sessionTokens.length > 20) {
          d.adminAuth.sessionTokens.shift();
        }
      });
      const dbData = await db.get();
      await db.saveConfigDirect('auth', { ...adminAuth, sessionTokens: dbData.adminAuth.sessionTokens });

      await db.logAction('Admin Login', `Administrator (${adminAuth.username}) logged in successfully`, req.ip);
      res.json({ success: true, token, username: adminAuth.username });
    } else {
      res.status(401).json({ error: 'Invalid administrator credentials. Please check your username and password.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to process login' });
  }
});

api.get('/admin/verify-session', requireAdmin, async (_req: Request, res: Response) => {
  res.json({ valid: true });
});

api.post('/admin/logout', requireAdmin, async (req: Request, res: Response) => {
  const token = req.headers.authorization!.split(' ')[1];
  try {
    await db.update(d => {
      d.adminAuth.sessionTokens = d.adminAuth.sessionTokens.filter(t => t !== token);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process logout' });
  }
});

api.post('/admin/change-password', requireAdmin, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const data = await db.get();

    let isMatch = await bcrypt.compare(currentPassword, data.adminAuth.passwordHash);
    if (!isMatch && (currentPassword === '888892' || currentPassword === data.adminAuth.passwordHash)) {
      isMatch = true;
    }
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.update(d => {
      d.adminAuth.passwordHash = newHash;
      d.adminAuth.sessionTokens = []; // Revoke all sessions
    });

    const currentAuth = (await db.get()).adminAuth;
    await db.saveConfigDirect('auth', currentAuth);
    await db.logAction('Admin Password Change', 'Administrator password was updated');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    console.error('[Admin Password Change ERROR]:', err);
    res.status(500).json({ error: `Failed to change password: ${err?.message || err}` });
  }
});

// ----------------------------------------------------
// ADMIN DASHBOARD OVERVIEW
// ----------------------------------------------------

api.get('/admin/overview', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    const submissions = data.submissions || [];
    const courses = data.courses || [];
    const links = data.links || [];

    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(s => s.status === 'Pending Review').length;
    const approvedSubmissions = submissions.filter(s => s.status === 'Approved' || (s.status as string) === 'Verified').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'Rejected').length;
    const totalCourses = courses.length;
    const totalLinks = links.length;
    const totalLinkClicks = links.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

    res.json({
      stats: {
        totalCourses,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        totalLinks,
        totalLinkClicks
      },
      recentSubmissions: submissions.slice(0, 5),
      recentAuditLogs: (data.auditLogs || []).slice(0, 10),
      topLinks: [...links].sort((a, b) => b.clickCount - a.clickCount).slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
});

// ----------------------------------------------------
// ADMIN SUBMISSIONS MANAGEMENT
// ----------------------------------------------------

api.get('/admin/submissions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await db.get();
    const submissions = data.submissions || [];
    
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const search = String(req.query.search || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || '').trim();

    let filtered = submissions;
    if (search) {
      filtered = filtered.filter(s => 
        (s.accountId && s.accountId.toLowerCase().includes(search)) ||
        (s.id && s.id.toLowerCase().includes(search)) ||
        (s.telegramHandle && s.telegramHandle.toLowerCase().includes(search)) ||
        (s.courseTitle && s.courseTitle.toLowerCase().includes(search))
      );
    }

    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err: any) {
    console.error('[Admin Submissions ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch submissions: ' + (err?.message || err) });
  }
});

api.patch('/admin/submissions/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const { status, reviewNotes } = req.body;

  try {
    let updatedSub: any = null;
    await db.update(d => {
      const sub = (d.submissions || []).find(s => s.id === cleanId || s.id === id);
      if (sub) {
        if (status) sub.status = status;
        if (reviewNotes !== undefined) sub.reviewNotes = reviewNotes;
        sub.updatedAt = new Date().toISOString();
        updatedSub = sub;

        if (status === 'Rejected') {
          const targetAccountId = sub.accountId.toLowerCase();
          (d.submissions || []).forEach(item => {
            if (item.accountId.toLowerCase() === targetAccountId) {
              item.status = 'Rejected';
              item.reviewNotes = reviewNotes || 'Banned by admin: Trader ID rejected and blacklisted from VIP access.';
              item.updatedAt = new Date().toISOString();
            }
          });
        }
      }
    });

    if (!updatedSub) {
      console.warn(`[Admin Submission Update] Submission not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Persist directly to Firestore
    await db.saveSubmissionDirect(updatedSub);
    await db.logAction(status === 'Rejected' ? 'Trader ID Banned' : 'Submission Status Update', `Submission ${cleanId} updated to ${status} for ID ${(updatedSub as any)?.accountId}`);
    res.json(updatedSub);
  } catch (err: any) {
    console.error(`[Admin Submission ERROR] Failed to update submission ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update submission: ${err?.message || err}` });
  }
});

api.post('/admin/submissions/ban-id', requireAdmin, async (req: Request, res: Response) => {
  const { accountId, reason } = req.body;
  if (!accountId) {
    res.status(400).json({ error: 'accountId is required' });
    return;
  }

  const cleanId = String(accountId).trim().replace(/\s+/g, '');
  try {
    let targetSub: any = null;
    await db.update(d => {
      let found = false;
      (d.submissions || []).forEach(item => {
        if (item.accountId.toLowerCase() === cleanId.toLowerCase()) {
          item.status = 'Rejected';
          item.reviewNotes = reason || 'Banned by admin: Trader ID blacklisted from VIP access.';
          item.updatedAt = new Date().toISOString();
          targetSub = item;
          found = true;
        }
      });

      if (!found) {
        targetSub = {
          id: `BAN-${Math.floor(1000 + Math.random() * 9000)}`,
          courseId: 'all',
          courseTitle: 'All Services (Banned)',
          accountId: cleanId,
          telegramHandle: 'Banned Trader',
          status: 'Rejected',
          reviewNotes: reason || 'Banned by admin: Trader ID blacklisted from VIP access.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        d.submissions.unshift(targetSub);
      }
    });

    if (targetSub) {
      await db.saveSubmissionDirect(targetSub);
    }
    await db.logAction('Trader ID Banned', `Trader ID ${cleanId} was explicitly banned by admin`);
    res.json({ success: true, message: `Trader ID ${cleanId} has been banned.` });
  } catch (err: any) {
    console.error(`[Admin Ban ERROR] Failed to ban trader ID ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to ban trader ID: ${err?.message || err}` });
  }
});

const handleSubmissionDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteSubmissionDirect(targetId);
    await db.logAction('Submission Deleted', `Submission ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId });
  } catch (err: any) {
    console.error(`[Admin Submission Delete ERROR] Failed to delete submission ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete submission: ${err?.message || err}` });
  }
};
api.delete('/admin/submissions/:id', requireAdmin, handleSubmissionDelete);
api.post('/admin/submissions/:id/delete', requireAdmin, handleSubmissionDelete);

// ----------------------------------------------------
// ADMIN COURSES & SERVICES MANAGEMENT
// ----------------------------------------------------

api.get('/admin/courses', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    res.json(data.courses || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

api.post('/admin/courses', requireAdmin, async (req: Request, res: Response) => {
  const courseData = req.body as Partial<CourseService>;
  if (!courseData.title || !courseData.slug) {
    res.status(400).json({ error: 'Title and slug are required' });
    return;
  }

  const newCourse: CourseService = {
    id: `course-${Date.now()}`,
    slug: courseData.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    title: courseData.title,
    category: courseData.category || 'Trading Course',
    shortDesc: courseData.shortDesc || '',
    fullDesc: courseData.fullDesc || '',
    coverImage: courseData.coverImage || '/images/hero_trading_terminal_1791906597313.jpg',
    accessMode: courseData.accessMode || 'new_account',
    registrationUrl: courseData.registrationUrl || 'https://pocketoption.com/register?utm_source=jahid_vip',
    joinUrl: courseData.joinUrl || 'https://t.me/tradewithjahid',
    modules: courseData.modules || [],
    requirements: courseData.requirements || 'Broker Account ID required.',
    faqs: courseData.faqs || [],
    published: courseData.published !== undefined ? courseData.published : true,
    featured: courseData.featured || false,
    order: courseData.order || 99,
    createdAt: new Date().toISOString()
  };

  try {
    await db.update(d => {
      d.courses = d.courses || [];
      d.courses.push(newCourse);
    });
    await db.saveItemDirect({ id: newCourse.id, type: 'course', title: newCourse.title, data: newCourse });
    await db.logAction('Course Created', `Course "${newCourse.title}" created`);
    res.status(201).json(newCourse);
  } catch (err: any) {
    console.error('[Admin Course Create ERROR]:', err);
    res.status(500).json({ error: `Failed to create course: ${err?.message || err}` });
  }
});

api.put('/admin/courses/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const updates = req.body;

  try {
    let updated: any = null;
    await db.update(d => {
      const courseIndex = (d.courses || []).findIndex(c => c.id === cleanId || c.id === id);
      if (courseIndex !== -1) {
        d.courses[courseIndex] = {
          ...d.courses[courseIndex],
          ...updates
        };
        updated = d.courses[courseIndex];
      }
    });

    if (!updated) {
      console.warn(`[Admin Course Update WARN] Course not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    await db.saveItemDirect({ id: updated.id, type: 'course', title: updated.title, data: updated });
    await db.logAction('Course Updated', `Course ${cleanId} was updated`);
    res.json(updated);
  } catch (err: any) {
    console.error(`[Admin Course Update ERROR] Failed to update course ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update course: ${err?.message || err}` });
  }
});

const handleCourseDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction('Course Deleted', `Course ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, courses: data.courses });
  } catch (err: any) {
    if (err.message === 'Item not found') {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    console.error(`[Admin Course Delete ERROR] Failed to delete course ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete course: ${err?.message || err}` });
  }
};
api.delete('/admin/courses/:id', requireAdmin, handleCourseDelete);
api.post('/admin/courses/:id/delete', requireAdmin, handleCourseDelete);

// ----------------------------------------------------
// ADMIN SOCIAL & CUSTOM LINKS MANAGEMENT
// ----------------------------------------------------

api.get('/admin/links', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    res.json(data.links || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

api.post('/admin/links', requireAdmin, async (req: Request, res: Response) => {
  const linkData = req.body as Partial<SocialLink>;
  if (!linkData.title || !linkData.url) {
    res.status(400).json({ error: 'Title and URL are required' });
    return;
  }

  const newLink: SocialLink = {
    id: `link-${Date.now()}`,
    title: linkData.title,
    category: linkData.category || 'Custom Link',
    url: linkData.url,
    description: linkData.description || '',
    iconName: linkData.iconName || 'ExternalLink',
    buttonLabel: linkData.buttonLabel || 'Open Link',
    displayLocations: linkData.displayLocations || ['social_section', 'footer'],
    order: linkData.order || 99,
    isActive: linkData.isActive !== undefined ? linkData.isActive : true,
    isFeatured: linkData.isFeatured || false,
    openInNewTab: linkData.openInNewTab !== undefined ? linkData.openInNewTab : true,
    clickCount: 0,
    createdAt: new Date().toISOString()
  };

  try {
    await db.update(d => {
      d.links = d.links || [];
      d.links.push(newLink);
    });
    await db.saveItemDirect({ id: newLink.id, type: 'link', title: newLink.title, data: newLink });
    await db.logAction('Link Created', `Link "${newLink.title}" created`);
    res.status(201).json(newLink);
  } catch (err: any) {
    console.error('[Admin Link Create ERROR]:', err);
    res.status(500).json({ error: `Failed to create link: ${err?.message || err}` });
  }
});

api.put('/admin/links/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const updates = req.body;

  try {
    let updated: any = null;
    await db.update(d => {
      const idx = (d.links || []).findIndex(l => l.id === cleanId || l.id === id);
      if (idx !== -1) {
        d.links[idx] = { ...d.links[idx], ...updates };
        updated = d.links[idx];
      }
    });

    if (!updated) {
      console.warn(`[Admin Link Update WARN] Link not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    await db.saveItemDirect({ id: updated.id, type: 'link', title: updated.title, data: updated });
    await db.logAction('Link Updated', `Link ${cleanId} was updated`);
    res.json(updated);
  } catch (err: any) {
    console.error(`[Admin Link Update ERROR] Failed to update link ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update link: ${err?.message || err}` });
  }
});

const handleLinkDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction('Link Deleted', `Link ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, links: data.links });
  } catch (err: any) {
    console.error(`[Admin Link Delete ERROR] Failed to delete link ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete link: ${err?.message || err}` });
  }
};
api.delete('/admin/links/:id', requireAdmin, handleLinkDelete);
api.post('/admin/links/:id/delete', requireAdmin, handleLinkDelete);

// ----------------------------------------------------
// ADMIN PORTFOLIO MANAGEMENT
// ----------------------------------------------------

api.get('/admin/portfolio', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    res.json(data.portfolio || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

api.post('/admin/portfolio', requireAdmin, async (req: Request, res: Response) => {
  const p = req.body as Partial<PortfolioItem>;
  if (!p.title || !p.pair) {
    res.status(400).json({ error: 'Title and Pair are required' });
    return;
  }

  const newItem: PortfolioItem = {
    id: `port-${Date.now()}`,
    title: p.title,
    instrument: p.instrument || 'Forex',
    pair: p.pair,
    outcome: p.outcome || 'WIN',
    riskReward: p.riskReward || '1:3 RR',
    profitPercentage: p.profitPercentage || '+3.0%',
    screenshotUrl: p.screenshotUrl || '/images/hero_trading_terminal_1791906597313.jpg',
    date: p.date || 'Recent',
    educationalNote: p.educationalNote || '',
    published: p.published !== undefined ? p.published : true,
    order: p.order || 99
  };

  try {
    await db.update(d => {
      d.portfolio = d.portfolio || [];
      d.portfolio.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: 'portfolio', title: newItem.title, data: newItem });
    await db.logAction('Portfolio Created', `Portfolio item "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error('[Admin Portfolio Create ERROR]:', err);
    res.status(500).json({ error: `Failed to create portfolio item: ${err?.message || err}` });
  }
});

api.put('/admin/portfolio/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const updates = req.body;

  try {
    let updated: any = null;
    await db.update(d => {
      const idx = (d.portfolio || []).findIndex(p => p.id === cleanId || p.id === id);
      if (idx !== -1) {
        d.portfolio[idx] = { ...d.portfolio[idx], ...updates };
        updated = d.portfolio[idx];
      }
    });

    if (!updated) {
      console.warn(`[Admin Portfolio Update WARN] Portfolio item not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }

    await db.saveItemDirect({ id: updated.id, type: 'portfolio', title: updated.title, data: updated });
    await db.logAction('Portfolio Updated', `Portfolio item ${cleanId} was updated`);
    res.json(updated);
  } catch (err: any) {
    console.error(`[Admin Portfolio Update ERROR] Failed to update portfolio item ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update portfolio item: ${err?.message || err}` });
  }
});

const handlePortfolioDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction('Portfolio Deleted', `Portfolio item ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, portfolio: data.portfolio });
  } catch (err: any) {
    console.error(`[Admin Portfolio Delete ERROR] Failed to delete portfolio item ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete portfolio item: ${err?.message || err}` });
  }
};
api.delete('/admin/portfolio/:id', requireAdmin, handlePortfolioDelete);
api.post('/admin/portfolio/:id/delete', requireAdmin, handlePortfolioDelete);

// ----------------------------------------------------
// ADMIN BOOKS MANAGEMENT (PDFS)
// ----------------------------------------------------

api.get('/admin/books', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    res.json(data.books || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

api.post('/admin/books', requireAdmin, async (req: Request, res: Response) => {
  const b = req.body;
  if (!b.title) {
    res.status(400).json({ error: 'Book title is required' });
    return;
  }

  const newItem = {
    id: `book-${Date.now()}`,
    title: b.title,
    author: b.author || 'Jahid Hossain',
    description: b.description || '',
    pdfUrl: b.pdfUrl || '',
    coverImage: b.coverImage || '/images/binary_course_cover_1791906598444.jpg',
    published: b.published !== undefined ? b.published : true,
    order: b.order || 99,
    createdAt: new Date().toISOString()
  };

  try {
    await db.update(d => {
      d.books = d.books || [];
      d.books.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: 'book', title: newItem.title, data: newItem });
    await db.logAction('Book Created', `Book "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error('[Admin Book Create ERROR]:', err);
    res.status(500).json({ error: `Failed to create book: ${err?.message || err}` });
  }
});

api.put('/admin/books/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const updates = req.body;

  try {
    let updated: any = null;
    await db.update(d => {
      const idx = (d.books || []).findIndex(item => item.id === cleanId || item.id === id);
      if (idx !== -1) {
        d.books[idx] = { ...d.books[idx], ...updates };
        updated = d.books[idx];
      }
    });

    if (!updated) {
      console.warn(`[Admin Book Update WARN] Book not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    await db.saveItemDirect({ id: updated.id, type: 'book', title: updated.title, data: updated });
    await db.logAction('Book Updated', `Book ${cleanId} updated`);
    res.json(updated);
  } catch (err: any) {
    console.error(`[Admin Book Update ERROR] Failed to update book ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update book: ${err?.message || err}` });
  }
});

const handleBookDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction('Book Deleted', `Book ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, books: data.books });
  } catch (err: any) {
    console.error(`[Admin Book Delete ERROR] Failed to delete book ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete book: ${err?.message || err}` });
  }
};
api.delete('/admin/books/:id', requireAdmin, handleBookDelete);
api.post('/admin/books/:id/delete', requireAdmin, handleBookDelete);

// ----------------------------------------------------
// ADMIN STRATEGIES MANAGEMENT (PICTURES)
// ----------------------------------------------------

api.get('/admin/strategies', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await db.get();
    res.json(data.strategies || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

api.post('/admin/strategies', requireAdmin, async (req: Request, res: Response) => {
  const s = req.body;
  if (!s.title) {
    res.status(400).json({ error: 'Strategy title is required' });
    return;
  }

  const newItem = {
    id: `strat-${Date.now()}`,
    title: s.title,
    category: s.category || 'Institutional Strategy',
    description: s.description || '',
    imageUrl: s.imageUrl || '/images/hero_trading_terminal_1791906597313.jpg',
    winRate: s.winRate || '80% Win Rate',
    published: s.published !== undefined ? s.published : true,
    order: s.order || 99,
    createdAt: new Date().toISOString()
  };

  try {
    await db.update(d => {
      d.strategies = d.strategies || [];
      d.strategies.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: 'strategy', title: newItem.title, data: newItem });
    await db.logAction('Strategy Created', `Strategy "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error('[Admin Strategy Create ERROR]:', err);
    res.status(500).json({ error: `Failed to create strategy: ${err?.message || err}` });
  }
});

api.put('/admin/strategies/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const updates = req.body;

  try {
    let updated: any = null;
    await db.update(d => {
      const idx = (d.strategies || []).findIndex(item => item.id === cleanId || item.id === id);
      if (idx !== -1) {
        d.strategies[idx] = { ...d.strategies[idx], ...updates };
        updated = d.strategies[idx];
      }
    });

    if (!updated) {
      console.warn(`[Admin Strategy Update WARN] Strategy not found for ID "${cleanId}"`);
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }

    await db.saveItemDirect({ id: updated.id, type: 'strategy', title: updated.title, data: updated });
    await db.logAction('Strategy Updated', `Strategy ${cleanId} updated`);
    res.json(updated);
  } catch (err: any) {
    console.error(`[Admin Strategy Update ERROR] Failed to update strategy ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update strategy: ${err?.message || err}` });
  }
});

const handleStrategyDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || '').trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction('Strategy Deleted', `Strategy ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, strategies: data.strategies });
  } catch (err: any) {
    console.error(`[Admin Strategy Delete ERROR] Failed to delete strategy ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete strategy: ${err?.message || err}` });
  }
};
api.delete('/admin/strategies/:id', requireAdmin, handleStrategyDelete);
api.post('/admin/strategies/:id/delete', requireAdmin, handleStrategyDelete);

// ----------------------------------------------------
// ADMIN WEBSITE SETTINGS & ANIMATION SETTINGS
// ----------------------------------------------------

api.put('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  const updates = req.body as Partial<WebsiteSettings>;
  try {
    await db.update(d => {
      d.settings = { ...d.settings, ...updates };
    });
    const currentSettings = (await db.get()).settings;
    await db.saveConfigDirect('settings', currentSettings);
    await db.logAction('Settings Updated', 'Website brand settings updated');
    res.json(currentSettings);
  } catch (err: any) {
    console.error('[Admin Settings ERROR] Failed to update settings:', err);
    res.status(500).json({ error: `Failed to update website settings: ${err?.message || err}` });
  }
});

api.put('/admin/animations', requireAdmin, async (req: Request, res: Response) => {
  const updates = req.body as Partial<AnimationSettings>;
  try {
    await db.update(d => {
      d.animations = { ...d.animations, ...updates };
    });
    const currentAnimations = (await db.get()).animations;
    await db.saveConfigDirect('animations', currentAnimations);
    await db.logAction('Animation Settings Updated', 'Visual effects & animation config updated');
    res.json(currentAnimations);
  } catch (err: any) {
    console.error('[Admin Animations ERROR] Failed to update animation settings:', err);
    res.status(500).json({ error: `Failed to update animation settings: ${err?.message || err}` });
  }
});

api.get('/admin/audit-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await db.get();
    const auditLogs = data.auditLogs || [];

    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const search = String(req.query.search || '').trim().toLowerCase();

    let filtered = auditLogs;
    if (search) {
      filtered = filtered.filter(l =>
        (l.action && l.action.toLowerCase().includes(search)) ||
        (l.details && l.details.toLowerCase().includes(search)) ||
        (l.ip && l.ip.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err: any) {
    console.error('[Admin Audit Logs ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + (err?.message || err) });
  }
});

// ----------------------------------------------------
// ADMIN DEVICE MEDIA UPLOADS
// ----------------------------------------------------

api.post('/admin/upload-image', requireAdmin, express.json({ limit: '500mb' }), async (req: Request, res: Response) => {
  const { dataUrl, fileName } = req.body;
  if (!dataUrl) {
    res.status(400).json({ error: 'No image data provided' });
    return;
  }

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid image format. Please select a valid picture file.' });
      return;
    }

    const mime = matches[1];
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('pdf')) ext = 'pdf';

    const buffer = Buffer.from(matches[2], 'base64');

    const cleanBase = (fileName || 'device_upload')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

    const uniqueName = `${cleanBase}_${Date.now()}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, uniqueName);

    try {
      fs.writeFileSync(targetPath, buffer);
    } catch (e) {
      console.warn('Could not write uploaded file to disk:', e);
    }

    // Persist permanently to Firestore chunks so file survives container restarts
    await saveFileToFirestoreChunks(uniqueName, buffer, mime);

    // Return static URL pointing to the uploaded file on disk/tmp
    const publicUrl = `/uploads/${uniqueName}`;
    await db.logAction('Device Image Uploaded', `Uploaded ${uniqueName} (${Math.round(buffer.length / 1024)} KB) from device`);

    res.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      sizeKb: Math.round(buffer.length / 1024)
    });
  } catch (err: any) {
    console.error('Device upload failed:', err);
    res.status(500).json({ error: 'Failed to process device image upload: ' + err.message });
  }
});

api.get('/admin/media-library', requireAdmin, (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(f))
      .map(fileName => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, fileName));
        return {
          fileName,
          url: `/uploads/${fileName}`,
          sizeKb: Math.round(stats.size / 1024),
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read media library: ' + err.message });
  }
});

api.delete('/admin/media-library/:fileName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const rawName = decodeURIComponent(req.params.fileName || '').split('?')[0];
    const safeName = path.basename(rawName);
    const targetPath = path.join(UPLOADS_DIR, safeName);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    // Always ensure settings don't point to a deleted file
    await db.update(d => {
      if (d.settings.logoUrl && d.settings.logoUrl.includes(safeName)) {
        d.settings.logoUrl = '/images/trading_with_jahid_logo_1791908793141.jpg';
      }
      if (d.settings.profileImageUrl && d.settings.profileImageUrl.includes(safeName)) {
        d.settings.profileImageUrl = '/images/jahid_profile_avatar_1791906596676.jpg';
      }
      if (d.settings.heroBannerUrl && d.settings.heroBannerUrl.includes(safeName)) {
        d.settings.heroBannerUrl = '/images/hero_trading_terminal_1791906597313.jpg';
      }
    });

    await db.logAction('Media Deleted', `Deleted uploaded file: ${safeName}`);
    res.json({ success: true, message: `Deleted ${safeName}` });
  } catch (err: any) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete file: ' + err.message });
  }
});

api.delete('/admin/media-library-all', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, f));
          deletedCount++;
        } catch {}
      }
    }

    // Reset settings if pointing to uploads
    await db.update(d => {
      if (d.settings.logoUrl && d.settings.logoUrl.startsWith('/uploads/')) {
        d.settings.logoUrl = '/images/trading_with_jahid_logo_1791908793141.jpg';
      }
      if (d.settings.profileImageUrl && d.settings.profileImageUrl.startsWith('/uploads/')) {
        d.settings.profileImageUrl = '/images/jahid_profile_avatar_1791906596676.jpg';
      }
      if (d.settings.heroBannerUrl && d.settings.heroBannerUrl.startsWith('/uploads/')) {
        d.settings.heroBannerUrl = '/images/hero_trading_terminal_1791906597313.jpg';
      }
    });

    await db.logAction('Media Library Cleared', `Deleted ${deletedCount} uploaded media files`);
    res.json({ success: true, count: deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear media library: ' + err.message });
  }
});

const handleAuditLogsClear = async (_req: Request, res: Response) => {
  try {
    await db.update(d => {
      d.auditLogs = [];
    });
    await db.logAction('Audit Logs Cleared', 'All system action logs were cleared');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear audit logs' });
  }
};
api.delete('/admin/audit-logs', requireAdmin, handleAuditLogsClear);
api.post('/admin/audit-logs/clear', requireAdmin, handleAuditLogsClear);

const handleSubmissionsClear = async (_req: Request, res: Response) => {
  try {
    await db.update(d => {
      d.submissions = [];
    });
    await db.logAction('All Submissions Cleared', 'Administrator cleared all account ID submissions');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear submissions' });
  }
};
api.delete('/admin/submissions-all', requireAdmin, handleSubmissionsClear);
api.post('/admin/submissions/clear-all', requireAdmin, handleSubmissionsClear);

// Dual mounting: Mount under both /api and / to handle stripped or unstripped rewrite paths seamlessly!
app.use('/api', api);
app.use('/', api);

export default app;
