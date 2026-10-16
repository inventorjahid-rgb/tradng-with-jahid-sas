import { PublicDataPayload, CourseService, SocialLink, PortfolioItem, BookItem, StrategyItem, AccountSubmission, WebsiteSettings, AnimationSettings, AuditLog } from './types.ts';

const ADMIN_TOKEN_KEY = 'jahid_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// ------------------------------------
// Public API Calls
// ------------------------------------

export async function fetchPublicData(): Promise<PublicDataPayload> {
  const res = await fetch('/api/public/data');
  if (!res.ok) {
    let detail = `Status ${res.status}`;
    try {
      const err = await res.json();
      if (err && err.error) detail = err.error;
    } catch {
      // ignore
    }
    throw new Error(`Failed to fetch platform data (${detail})`);
  }
  return res.json();
}

export async function submitAccountId(payload: {
  courseId: string;
  accountId: string;
  telegramHandle?: string;
  userEmail?: string;
}): Promise<{
  success: boolean;
  submissionId: string;
  status: string;
  isApproved?: boolean;
  isBanned?: boolean;
  joinUrl?: string;
  courseTitle?: string;
  message: string;
}> {
  const res = await fetch('/api/public/submit-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    const errorObj: any = new Error(err.error || err.message || 'Submission failed');
    errorObj.isBanned = Boolean(err.isBanned || res.status === 403);
    errorObj.status = err.status;
    throw errorObj;
  }
  return res.json();
}

export async function checkVerification(params: {
  submissionId?: string;
  accountId?: string;
  courseId?: string;
}): Promise<{
  submissionId: string;
  status: string;
  isApproved: boolean;
  isBanned?: boolean;
  courseTitle: string;
  joinUrl?: string;
  reviewNotes?: string;
}> {
  const query = new URLSearchParams();
  if (params.submissionId) query.set('submissionId', params.submissionId);
  if (params.accountId) query.set('accountId', params.accountId);
  if (params.courseId) query.set('courseId', params.courseId);

  const res = await fetch(`/api/public/check-verification?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Verification check failed' }));
    const errorObj: any = new Error(err.error || err.message || 'Verification check failed');
    errorObj.isBanned = Boolean(err.isBanned || res.status === 403);
    errorObj.status = err.status;
    throw errorObj;
  }
  return res.json();
}

export async function trackLinkClick(linkId: string): Promise<void> {
  try {
    await fetch('/api/public/track-link-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId })
    });
  } catch (e) {
    // Non-blocking telemetry
  }
}

// ------------------------------------
// Admin API Calls
// ------------------------------------

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token: string; username: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid credentials' }));
    throw new Error(err.error || 'Login failed');
  }
  const data = await res.json();
  setAdminToken(data.token);
  return data;
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/admin/verify-session', {
      headers: authHeaders()
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: authHeaders()
    });
  } finally {
    clearAdminToken();
  }
}

export async function fetchAdminOverview(): Promise<{
  stats: {
    totalCourses: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    totalLinks: number;
    totalLinkClicks: number;
  };
  recentSubmissions: AccountSubmission[];
  recentAuditLogs: AuditLog[];
  topLinks: SocialLink[];
}> {
  const res = await fetch('/api/admin/overview', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load admin overview');
  return res.json();
}

export async function fetchAdminSubmissions(): Promise<AccountSubmission[]> {
  const res = await fetch('/api/admin/submissions', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

export async function updateSubmission(id: string, updates: { status?: string; reviewNotes?: string }): Promise<AccountSubmission> {
  const res = await fetch(`/api/admin/submissions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update submission');
  return res.json();
}

export async function deleteSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/submissions/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete submission');
}

export async function fetchAdminCourses(): Promise<CourseService[]> {
  const res = await fetch('/api/admin/courses', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function createCourse(data: Partial<CourseService>): Promise<CourseService> {
  const res = await fetch('/api/admin/courses', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create course');
  return res.json();
}

export async function updateCourse(id: string, data: Partial<CourseService>): Promise<CourseService> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update course');
  return res.json();
}

export async function deleteCourse(id: string): Promise<void> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete course');
}

export async function fetchAdminLinks(): Promise<SocialLink[]> {
  const res = await fetch('/api/admin/links', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch links');
  return res.json();
}

export async function createLink(data: Partial<SocialLink>): Promise<SocialLink> {
  const res = await fetch('/api/admin/links', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create link');
  return res.json();
}

export async function updateLink(id: string, data: Partial<SocialLink>): Promise<SocialLink> {
  const res = await fetch(`/api/admin/links/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update link');
  return res.json();
}

export async function deleteLink(id: string): Promise<void> {
  const res = await fetch(`/api/admin/links/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete link');
}

export async function fetchAdminPortfolio(): Promise<PortfolioItem[]> {
  const res = await fetch('/api/admin/portfolio', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export async function createPortfolioItem(data: Partial<PortfolioItem>): Promise<PortfolioItem> {
  const res = await fetch('/api/admin/portfolio', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create portfolio item');
  return res.json();
}

export async function updatePortfolioItem(id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem> {
  const res = await fetch(`/api/admin/portfolio/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update portfolio item');
  return res.json();
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const res = await fetch(`/api/admin/portfolio/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete portfolio item');
}

export async function updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update website settings');
  return res.json();
}

export async function updateAnimationSettings(animations: Partial<AnimationSettings>): Promise<AnimationSettings> {
  const res = await fetch('/api/admin/animations', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(animations)
  });
  if (!res.ok) throw new Error('Failed to update animation settings');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Password change failed' }));
    throw new Error(err.error || 'Password change failed');
  }
}

export async function uploadImage(file: File): Promise<{ success: boolean; url: string; fileName: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            dataUrl,
            fileName: file.name
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file from device'));
    reader.readAsDataURL(file);
  });
}

export async function fetchMediaLibrary(): Promise<{ fileName: string; url: string; sizeKb: number; createdAt: string }[]> {
  const res = await fetch('/api/admin/media-library', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load media library');
  return res.json();
}

export async function deleteMediaFile(fileName: string): Promise<void> {
  const res = await fetch(`/api/admin/media-library/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete file' }));
    throw new Error(err.error || 'Failed to delete file');
  }
}

export async function clearAuditLogs(): Promise<void> {
  const res = await fetch('/api/admin/audit-logs', {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to clear audit logs');
}

export async function clearAllSubmissions(): Promise<void> {
  const res = await fetch('/api/admin/submissions-all', {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to clear all submissions');
}

export async function clearAllMediaFiles(): Promise<void> {
  const res = await fetch('/api/admin/media-library-all', {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to clear media library');
}

export async function fetchAdminBooks(): Promise<BookItem[]> {
  const res = await fetch('/api/admin/books', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function createBook(data: Partial<BookItem>): Promise<BookItem> {
  const res = await fetch('/api/admin/books', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create book');
  return res.json();
}

export async function updateBook(id: string, data: Partial<BookItem>): Promise<BookItem> {
  const res = await fetch(`/api/admin/books/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update book');
  return res.json();
}

export async function deleteBook(id: string): Promise<void> {
  const res = await fetch(`/api/admin/books/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete book');
}

export async function fetchAdminStrategies(): Promise<StrategyItem[]> {
  const res = await fetch('/api/admin/strategies', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch strategies');
  return res.json();
}

export async function createStrategy(data: Partial<StrategyItem>): Promise<StrategyItem> {
  const res = await fetch('/api/admin/strategies', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create strategy');
  return res.json();
}

export async function updateStrategy(id: string, data: Partial<StrategyItem>): Promise<StrategyItem> {
  const res = await fetch(`/api/admin/strategies/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update strategy');
  return res.json();
}

export async function deleteStrategy(id: string): Promise<void> {
  const res = await fetch(`/api/admin/strategies/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete strategy');
}

export async function banTraderId(accountId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/submissions/ban-id', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ accountId, reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to ban trader ID' }));
    throw new Error(err.error || 'Failed to ban trader ID');
  }
  return res.json();
}



