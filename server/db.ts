import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  limit, 
  deleteDoc
} from 'firebase/firestore/lite';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0845142804",
  appId: "1:667788705815:web:a5758ace8d5ff2754b5c52",
  apiKey: "AIzaSyAaYi9AxoKZGnYKRY3p20Ce0aflSGCIYtE",
  authDomain: "gen-lang-client-0845142804.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-tradingwithjahid-84b3e1d0-7172-4d83-bf69-4db6867ea1a0",
  storageBucket: "gen-lang-client-0845142804.firebasestorage.app",
  messagingSenderId: "667788705815",
  measurementId: "",
  oAuthClientId: "667788705815-5c6nfgf1r11cr2mkqodri0c2rjs9i1i8.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

function getFirebaseConfig(): any {
  const configPaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__filename, 'firebase-applet-config.json'),
    path.resolve(__dirname, '../firebase-applet-config.json')
  ];
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {}
  }
  return DEFAULT_FIREBASE_CONFIG;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let firestoreDb: any = null;
try {
  const configData = getFirebaseConfig();
  if (configData && configData.apiKey && configData.projectId) {
    const app = getApps().find(a => a.name === 'server-app-db') || initializeApp(configData, 'server-app-db');
    firestoreDb = getFirestore(app, configData.firestoreDatabaseId || '(default)');
    console.log('[Database] Firestore successfully connected to project:', configData.projectId);
  }
} catch (e: any) {
  console.warn('Warning: Could not initialize Firebase in server/db.ts:', e?.message || e);
}

const LOCAL_DATA_PATH = path.resolve(process.cwd(), 'data/db.json');
const TMP_DATA_PATH = path.resolve('/tmp', 'trading_jahid_db.json');

function getDbFilePath(): string {
  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return LOCAL_DATA_PATH;
  } catch {
    return TMP_DATA_PATH;
  }
}

const DATA_FILE_PATH = getDbFilePath();

export const UPLOADS_DIR = (() => {
  try {
    const dir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    const tmpDir = path.resolve('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
})();

/**
 * Bulletproof recursive helper to strip undefined values so Firestore never errors on WriteBatch
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === undefined || obj === null) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result;
}

/**
 * Save uploaded file / PDF to permanent Firestore chunks so it survives container restarts
 */
export async function saveFileToFirestoreChunks(fileName: string, buffer: Buffer, mimeType: string = 'application/octet-stream'): Promise<void> {
  if (!firestoreDb) return;
  try {
    const safeKey = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const base64Data = buffer.toString('base64');
    const CHUNK_SIZE = 450 * 1024; // 450KB chunks to stay safely under 1MB Firestore doc limit
    const totalChunks = Math.max(1, Math.ceil(base64Data.length / CHUNK_SIZE));

    // Save metadata
    await setDoc(doc(firestoreDb, 'file_chunks', `${safeKey}_meta`), cleanForFirestore({
      fileName,
      safeKey,
      totalChunks,
      mimeType,
      sizeBytes: buffer.length,
      updatedAt: new Date().toISOString()
    }));

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(firestoreDb, 'file_chunks', `${safeKey}_part_${i}`), cleanForFirestore({
        fileName,
        safeKey,
        chunkIndex: i,
        data: chunkData
      }));
    }
    console.log(`[File Chunks] Saved ${fileName} (${Math.round(buffer.length / 1024)} KB, ${totalChunks} chunks) to Firestore permanently.`);
  } catch (err: any) {
    console.warn(`[File Chunks] Could not write ${fileName} to Firestore chunks:`, err?.message || err);
  }
}

/**
 * Restore an uploaded file / PDF from Firestore chunks if the ephemeral disk was wiped
 */
export async function getFileFromFirestoreChunks(fileName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!firestoreDb) return null;
  try {
    const safeKey = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const metaSnap = await getDoc(doc(firestoreDb, 'file_chunks', `${safeKey}_meta`));
    if (!metaSnap.exists()) return null;
    const meta = metaSnap.data();
    const totalChunks = meta.totalChunks || 1;
    const mimeType = meta.mimeType || 'application/octet-stream';

    const parts: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(doc(firestoreDb, 'file_chunks', `${safeKey}_part_${i}`));
      if (!chunkSnap.exists()) {
        console.warn(`[File Chunks] Missing chunk ${i} for ${fileName}`);
        return null;
      }
      parts.push(chunkSnap.data().data || '');
    }

    const fullBase64 = parts.join('');
    const buffer = Buffer.from(fullBase64, 'base64');
    return { buffer, mimeType };
  } catch (err) {
    console.warn(`[File Chunks] Error reading ${fileName} from Firestore:`, err);
    return null;
  }
}

export function saveBase64ToDisk(dataUrl: string, prefix: string, forceDisk: boolean = false): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;
    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeKb = buffer.length / 1024;

    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('pdf')) ext = 'pdf';

    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(targetPath, buffer);

    // Also persist large files to Firestore chunks asynchronously so Cloud Run restarts don't lose them!
    saveFileToFirestoreChunks(fileName, buffer, mime).catch(() => {});

    console.log(`[Upload] Saved ${fileName} (${Math.round(sizeKb)} KB) to disk and scheduled Firestore permanent backup.`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.warn('[Upload] Failed to convert base64 to file:', err);
    return dataUrl;
  }
}

export interface WebsiteSettings {
  brandName: string; tagline: string; heroTitle: string; heroSubtitle: string;
  heroTitlePrimary?: string; heroTitleHighlight?: string; heroBadgeText?: string;
  coursesBadgeText?: string; coursesTitlePrimary?: string; coursesTitleHighlight?: string;
  coursesSubtitle?: string; profileImageUrl: string; logoUrl: string; heroBannerUrl: string;
  telegramCommunityUrl: string; telegramAdminUrl: string; contactEmail: string; whatsappUrl: string;
  primaryColor: string; secondaryColor: string; accentGold: string; bgColor: string;
  aboutBio: string; aboutJourney: string; aboutExpertise: string[];
  aboutStats: { label: string; value: string }[];
  footerDisclaimer: string; riskNotice: string;
}

export interface AnimationSettings {
  enable3D: boolean; enableParticles: boolean; enableCharts: boolean; enableCursor: boolean;
  enableScroll: boolean; intensity: 'low' | 'medium' | 'high'; speed: number;
  particleDensity: number; backgroundStyle: 'matte_obsidian' | 'emerald_mesh' | 'cyber_grid';
  enableOnMobile: boolean;
}

export interface CourseService {
  id: string; slug: string; title: string; category: string; shortDesc: string; fullDesc: string;
  coverImage: string; accessMode: 'new_account' | 'existing_id'; registrationUrl: string;
  joinUrl: string; modules: string[]; requirements: string; faqs: { question: string; answer: string }[];
  published: boolean; featured: boolean; order: number; createdAt: string;
}

export interface SocialLink {
  id: string; title: string; category: string; url: string; description: string;
  iconName: string; buttonLabel: string; 
  displayLocations: ('navbar' | 'hero' | 'social_section' | 'course_pages' | 'community_page' | 'contact_page' | 'footer' | 'floating')[];
  order: number; isActive: boolean; isFeatured: boolean; openInNewTab: boolean;
  clickCount: number; lastClickedAt?: string; createdAt: string;
}

export interface AccountSubmission {
  id: string; courseId: string; courseTitle: string; accountId: string;
  telegramHandle: string; userEmail?: string; status: 'Pending Review' | 'Approved' | 'Rejected' | 'Verified';
  reviewNotes: string; createdAt: string; updatedAt: string;
}

export interface PortfolioItem {
  id: string; title: string; instrument: 'Binary' | 'Forex' | 'Bot' | 'Crypto';
  pair: string; outcome: 'WIN' | 'PROFIT' | 'ANALYSIS'; riskReward: string;
  profitPercentage: string; screenshotUrl: string; date: string; educationalNote: string;
  published: boolean; order: number;
}

export interface BookItem {
  id: string; title: string; author: string; description: string; pdfUrl: string;
  coverImage: string; published: boolean; order: number; createdAt: string;
}

export interface StrategyItem {
  id: string; title: string; category: string; description: string; imageUrl: string;
  winRate: string; published: boolean; order: number; createdAt: string;
}

export interface AuditLog {
  id: string; action: string; details: string; timestamp: string; ip?: string;
}

export interface DatabaseSchema {
  settings: WebsiteSettings;
  animations: AnimationSettings;
  courses: CourseService[];
  links: SocialLink[];
  submissions: AccountSubmission[];
  portfolio: PortfolioItem[];
  books: BookItem[];
  strategies: StrategyItem[];
  auditLogs: AuditLog[];
  adminAuth: {
    username: string;
    passwordHash: string;
    sessionTokens: string[];
  };
}

const INITIAL_DATA: DatabaseSchema = {
  settings: {
    brandName: "Trading With Jahid",
    tagline: "Professional Forex & Binary Trading Community",
    heroTitle: "Master Trading With Jahid",
    heroSubtitle: "Institutional-grade Binary & Forex trading education, high-probability algorithmic signals, quantitative bots, and an exclusive community of elite traders.",
    heroTitlePrimary: "Master The Markets With",
    heroTitleHighlight: "Professional Precision",
    heroBadgeText: "Elite Trading Mastery & VIP Signals",
    coursesBadgeText: "Trading Curriculum & Tools · Structured Path",
    coursesTitlePrimary: "Comprehensive Courses,",
    coursesTitleHighlight: "Algorithmic Bots & Signals",
    coursesSubtitle: "Eliminate guesswork with institutional methodologies. Select a course or service below to review the curriculum and initiate verified access.",
    profileImageUrl: "/images/jahid_profile_avatar_1791906596676.jpg",
    logoUrl: "/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg",
    heroBannerUrl: "/images/hero_trading_terminal_1791906597313.jpg",
    telegramCommunityUrl: "https://t.me/tradewithjahid",
    telegramAdminUrl: "https://t.me/tradewithjahid",
    contactEmail: "mentor@tradewithjahid.com",
    whatsappUrl: "https://wa.me/message/TRADINGWITHJAHID",
    primaryColor: "#00D084",
    secondaryColor: "#087F5B",
    accentGold: "#D4AF37",
    bgColor: "#080B0A",
    aboutBio: "Professional financial trader, market technician, and trading mentor with over 7 years of specialized expertise in high-frequency Binary price action, institutional Forex order flow, and quantitative algorithmic strategies.",
    aboutJourney: "Starting with small capital and navigating market volatility taught me that emotional discipline and mathematical edge always beat hype. Over the past 7 years, I developed systematic rule-based setups that transform everyday traders into calculated market operators.",
    aboutExpertise: [
      "Binary Options Candlestick Psychology & Rejection Trading",
      "Institutional Forex Liquidity (SMC & Order Block Dynamics)",
      "High-Frequency Risk Management & Capital Preservation",
      "Algorithmic Trading Bot Deployment & Backtesting",
      "Live Market Tape Reading & Session Volatility Exploitation"
    ],
    aboutStats: [
      { label: "Community Members", value: "14,800+" },
      { label: "Live Trading Hours", value: "1,200+" },
      { label: "Course Graduates", value: "3,400+" },
      { label: "Verified Win Rate", value: "84.2%" }
    ],
    footerDisclaimer: "Trading With Jahid is an independent educational academy. We do not provide financial advice, broker services, or guarantee profits. All content is for educational and training purposes.",
    riskNotice: "High Risk Warning: Trading Forex, Binary Options, and derivative financial contracts carries a high level of risk to your capital."
  },
  animations: {
    enable3D: true, enableParticles: true, enableCharts: true, enableCursor: true,
    enableScroll: true, intensity: 'medium', speed: 1.0, particleDensity: 75,
    backgroundStyle: 'matte_obsidian', enableOnMobile: true
  },
  courses: [
    {
      id: "course-1792743496669",
      slug: "binary-options-masterclass",
      title: "Binary Options Candlestick Psychology",
      category: "Binary Trading Course",
      shortDesc: "Master 60-second and 5-minute price action rejections, SNR reversals, and market psychology.",
      fullDesc: "Complete binary options masterclass focusing on high-probability candle dynamics, institutional rejection levels, and disciplined execution.",
      coverImage: "/images/binary_course_cover_1791906598444.jpg",
      accessMode: "new_account",
      registrationUrl: "https://pocketoption.com/register?utm_source=jahid_vip",
      joinUrl: "https://t.me/tradewithjahid",
      modules: ["Module 1: Candlestick Anatomy", "Module 2: Key Levels & SNR", "Module 3: False Breakout Traps", "Module 4: 85%+ Win Rate Playbook"],
      requirements: "Broker Account ID required.",
      faqs: [{ question: "Is this suitable for beginners?", answer: "Yes, we teach from foundational price action to advanced institutional setups." }],
      published: true,
      featured: true,
      order: 1,
      createdAt: "2026-10-23T08:18:16.669Z"
    },
    {
      id: "course-1792743496766",
      slug: "forex-institutional-smc",
      title: "Institutional Forex Liquidity (SMC)",
      category: "Forex Trading Course",
      shortDesc: "Trade alongside smart money using Order Blocks, Fair Value Gaps (FVG), and liquidity sweeps.",
      fullDesc: "Comprehensive institutional Forex course revealing bank liquidity algorithms, premium/discount zones, and high risk-to-reward swing execution.",
      coverImage: "/images/forex_course_cover_1791906599347.jpg",
      accessMode: "new_account",
      registrationUrl: "https://pocketoption.com/register?utm_source=jahid_vip",
      joinUrl: "https://t.me/tradewithjahid",
      modules: ["Module 1: Market Structure & BOS", "Module 2: Order Blocks & FVG", "Module 3: Liquidity Sweeps", "Module 4: Trade Management 1:4+ RR"],
      requirements: "Broker Account ID required.",
      faqs: [{ question: "Which currency pairs are covered?", answer: "Major pairs including EUR/USD, GBP/USD, USD/JPY, and Gold (XAU/USD)." }],
      published: true,
      featured: true,
      order: 2,
      createdAt: "2026-10-23T08:18:16.766Z"
    }
  ],
  links: [
    {
      id: "link-tg-channel",
      title: "Official Telegram Channel",
      category: "Telegram Channel",
      url: "https://t.me/tradewithjahid",
      description: "Daily market analysis, VIP live results, and instant announcements.",
      iconName: "Send",
      buttonLabel: "Join Telegram Channel",
      displayLocations: ["navbar", "hero", "social_section", "footer"],
      order: 1,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 1420,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-tg-group",
      title: "VIP Traders Discussion Group",
      category: "Telegram Group",
      url: "https://t.me/tradewithjahid",
      description: "Chat with fellow community members, share live setups, and discuss market trends.",
      iconName: "Send",
      buttonLabel: "Join Community Group",
      displayLocations: ["social_section", "footer"],
      order: 2,
      isActive: true,
      isFeatured: false,
      openInNewTab: true,
      clickCount: 890,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-tg-admin",
      title: "Direct Admin / Mentor Desk",
      category: "Telegram Admin / Direct Contact",
      url: "https://t.me/tradewithjahid",
      description: "Direct VIP support, account verification assistance, and private inquiries.",
      iconName: "Send",
      buttonLabel: "Contact Jahid",
      displayLocations: ["social_section", "footer", "floating"],
      order: 3,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 650,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-youtube",
      title: "Official YouTube Channel",
      category: "YouTube Channel",
      url: "https://youtube.com/@tradewithjahid",
      description: "In-depth trading breakdowns, candlestick psychology webinars, and live trading sessions.",
      iconName: "Youtube",
      buttonLabel: "Subscribe on YouTube",
      displayLocations: ["social_section", "footer"],
      order: 4,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 1120,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-whatsapp",
      title: "Official WhatsApp Support",
      category: "WhatsApp Direct Contact",
      url: "https://wa.me/message/TRADINGWITHJAHID",
      description: "Direct WhatsApp contact for quick questions and verification status.",
      iconName: "PhoneCall",
      buttonLabel: "Chat on WhatsApp",
      displayLocations: ["social_section", "footer", "floating"],
      order: 5,
      isActive: true,
      isFeatured: false,
      openInNewTab: true,
      clickCount: 430,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-facebook",
      title: "Official Facebook Page",
      category: "Facebook Page",
      url: "https://facebook.com/tradewithjahid",
      description: "Follow our verified Facebook page for daily motivation and trading updates.",
      iconName: "Facebook",
      buttonLabel: "Follow on Facebook",
      displayLocations: ["social_section", "footer"],
      order: 6,
      isActive: true,
      isFeatured: false,
      openInNewTab: true,
      clickCount: 310,
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "link-pocketoption",
      title: "Pocket Option Broker Portal",
      category: "Registration Link",
      url: "https://pocketoption.com/register?utm_source=jahid_vip",
      description: "Official partner registration link with verified fast deposit and withdrawal processing.",
      iconName: "Zap",
      buttonLabel: "Register Trader Account",
      displayLocations: ["social_section", "footer", "course_pages"],
      order: 7,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 1850,
      createdAt: "2026-10-20T10:00:00.000Z"
    }
  ],
  submissions: [],
  portfolio: [
    {
      id: "port-2",
      title: "USD/JPY 60-Second Bollinger Squeeze Breakout",
      instrument: "Binary",
      pair: "USD/JPY",
      outcome: "WIN",
      riskReward: "1:1.9 Binary",
      profitPercentage: "+88%",
      screenshotUrl: "/images/hero_trading_terminal_1791906597313.jpg",
      date: "October 2026",
      educationalNote: "Clean 3-candle rejection from dynamic 20 EMA with stochastic oversold confirmation.",
      published: true,
      order: 1
    },
    {
      id: "port-3",
      title: "Gold (XAU/USD) Daily Order Block Bounce",
      instrument: "Forex",
      pair: "XAU/USD",
      outcome: "WIN",
      riskReward: "1:4.2 RR",
      profitPercentage: "+4.2%",
      screenshotUrl: "/images/forex_course_cover_1791906599347.jpg",
      date: "October 2026",
      educationalNote: "High time frame 4H Order Block mitigation during London session open.",
      published: true,
      order: 2
    },
    {
      id: "port-4",
      title: "Alpha Engine Quant Bot Forward Run",
      instrument: "Bot",
      pair: "EUR/USD",
      outcome: "PROFIT",
      riskReward: "1:2.8 RR",
      profitPercentage: "+14.6%",
      screenshotUrl: "/images/hero_trading_terminal_1791906597313.jpg",
      date: "October 2026",
      educationalNote: "Automated execution on micro liquidity traps with dynamic trailing stop loss.",
      published: true,
      order: 3
    }
  ],
  books: [
    {
      id: "book-candlestick-bible",
      title: "Candlestick Psychology & Market Structure Bible",
      author: "Jahid Hossain",
      description: "Complete institutional guide to candlestick momentum, rejection wicks, buyer/seller exhaustion, and trap identification.",
      pdfUrl: "",
      coverImage: "/images/binary_course_cover_1791906598444.jpg",
      published: true,
      order: 1,
      createdAt: "2026-10-22T10:00:00.000Z"
    },
    {
      id: "book-smc-liquidity",
      title: "Smart Money Concepts & Liquidity Blueprint",
      author: "Jahid Hossain",
      description: "Master Fair Value Gaps (FVG), Breaker Blocks, Asian range liquidity sweeps, and institutional order flow.",
      pdfUrl: "",
      coverImage: "/images/forex_course_cover_1791906599347.jpg",
      published: true,
      order: 2,
      createdAt: "2026-10-22T10:00:00.000Z"
    }
  ],
  strategies: [
    {
      id: "strat-liquidity-sweep",
      title: "London Session Liquidity Sweep Strategy",
      category: "Forex SMC Setup",
      description: "Identify engineered liquidity above the Asian high, wait for clean 15m candle rejection, and enter on the 5m Fair Value Gap.",
      imageUrl: "/images/hero_trading_terminal_1791906597313.jpg",
      winRate: "86% Win Rate",
      published: true,
      order: 1,
      createdAt: "2026-10-22T10:00:00.000Z"
    },
    {
      id: "strat-snr-rejection",
      title: "60-Second Binary SNR Rejection Playbook",
      category: "Binary Precision",
      description: "High-probability binary execution combining whole round numbers, stochastic divergence, and wick exhaustion patterns.",
      imageUrl: "/images/binary_course_cover_1791906598444.jpg",
      winRate: "89% Win Rate",
      published: true,
      order: 2,
      createdAt: "2026-10-22T10:00:00.000Z"
    }
  ],
  auditLogs: [],
  adminAuth: {
    username: "admin",
    passwordHash: "888892",
    sessionTokens: []
  }
};

class Database {
  private data: DatabaseSchema;
  private initPromise: Promise<void>;
  private updateQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.data = this.loadFromFile();
    this.initPromise = this.syncFromFirestore();
  }

  private async syncFromFirestore() {
    if (!firestoreDb) return;
    try {
      console.log('[Database] Synchronizing with Firestore collections...');
      
      // 1. Safe legacy check (non-blocking)
      try {
        const legacyRef = doc(firestoreDb, 'app_state', 'main');
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          const raw = legacySnap.data();
          if (raw && raw.payloadString) {
            console.log('[Database] Found legacy data. Migrating to new structure...');
            const legacyData = JSON.parse(raw.payloadString);
            await this.migrateLegacyData(legacyData);
            await deleteDoc(legacyRef).catch(() => {});
          }
        }
      } catch (err: any) {
        // Safe to ignore legacy doc errors
      }

      // 2. Load Config documents
      try {
        const [settingsSnap, animationsSnap, authSnap] = await Promise.all([
          getDoc(doc(firestoreDb, 'app_config', 'settings')).catch(() => null),
          getDoc(doc(firestoreDb, 'app_config', 'animations')).catch(() => null),
          getDoc(doc(firestoreDb, 'app_config', 'auth')).catch(() => null)
        ]);

        if (settingsSnap && settingsSnap.exists()) {
          this.data.settings = { ...this.data.settings, ...settingsSnap.data() };
        }
        if (animationsSnap && animationsSnap.exists()) {
          this.data.animations = { ...this.data.animations, ...animationsSnap.data() };
        }
        if (authSnap && authSnap.exists()) {
          this.data.adminAuth = { ...this.data.adminAuth, ...authSnap.data() };
        }
      } catch (e: any) {
        console.warn('[Database] Config sync notice:', e?.message || e);
      }

      // 3. Load Items (Courses, Books, Strategies, Portfolio, Links)
      try {
        const itemsSnap = await getDocs(collection(firestoreDb, 'items'));
        const items: any[] = [];
        itemsSnap.forEach(d => items.push(d.data()));

        const fsCourses = items.filter(i => i.type === 'course').map(i => i.data);
        const fsBooks = items.filter(i => i.type === 'book').map(i => i.data);
        const fsStrategies = items.filter(i => i.type === 'strategy').map(i => i.data);
        const fsPortfolio = items.filter(i => i.type === 'portfolio').map(i => i.data);
        const fsLinks = items.filter(i => i.type === 'link').map(i => i.data);

        // Only overwrite local list if Firestore actually has items for that type,
        // otherwise upload local initial items to Firestore so they are never lost!
        if (fsCourses.length > 0) {
          this.data.courses = fsCourses.sort((a,b) => (a.order || 0) - (b.order || 0));
        } else if (this.data.courses.length > 0) {
          for (const c of this.data.courses) {
            await setDoc(doc(firestoreDb, 'items', c.id), cleanForFirestore({ id: c.id, type: 'course', title: c.title, data: c })).catch(() => {});
          }
        }

        if (fsBooks.length > 0) {
          this.data.books = fsBooks.sort((a,b) => (a.order || 0) - (b.order || 0));
        } else if (this.data.books.length > 0) {
          for (const b of this.data.books) {
            await setDoc(doc(firestoreDb, 'items', b.id), cleanForFirestore({ id: b.id, type: 'book', title: b.title, data: b })).catch(() => {});
          }
        }

        if (fsStrategies.length > 0) {
          this.data.strategies = fsStrategies.sort((a,b) => (a.order || 0) - (b.order || 0));
        } else if (this.data.strategies.length > 0) {
          for (const s of this.data.strategies) {
            await setDoc(doc(firestoreDb, 'items', s.id), cleanForFirestore({ id: s.id, type: 'strategy', title: s.title, data: s })).catch(() => {});
          }
        }

        if (fsPortfolio.length > 0) {
          this.data.portfolio = fsPortfolio.sort((a,b) => (a.order || 0) - (b.order || 0));
        } else if (this.data.portfolio.length > 0) {
          for (const p of this.data.portfolio) {
            await setDoc(doc(firestoreDb, 'items', p.id), cleanForFirestore({ id: p.id, type: 'portfolio', title: p.title, data: p })).catch(() => {});
          }
        }

        if (fsLinks.length > 0) {
          this.data.links = fsLinks.sort((a,b) => (a.order || 0) - (b.order || 0));
        } else if (this.data.links.length > 0) {
          for (const l of this.data.links) {
            await setDoc(doc(firestoreDb, 'items', l.id), cleanForFirestore({ id: l.id, type: 'link', title: l.title, data: l })).catch(() => {});
          }
        }
      } catch (e: any) {
        console.warn('[Database] Items sync notice:', e?.message || e);
      }

      // 4. Load Submissions and Logs
      try {
        const subsSnap = await getDocs(query(collection(firestoreDb, 'submissions'), limit(200)));
        if (subsSnap.docs.length > 0) {
          this.data.submissions = subsSnap.docs.map(d => d.data() as AccountSubmission).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch {}

      try {
        const logsSnap = await getDocs(query(collection(firestoreDb, 'audit_logs'), limit(50)));
        if (logsSnap.docs.length > 0) {
          this.data.auditLogs = logsSnap.docs.map(d => d.data() as AuditLog).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {}

      this.saveToLocalFile();
      console.log('[Database] Firestore synchronization complete.');
    } catch (e: any) {
      console.warn('[Database] Sync failed:', e?.message || e);
    }
  }

  private async migrateLegacyData(legacyData: any) {
    if (!firestoreDb) return;
    try {
      const tasks: Promise<void>[] = [];
      if (legacyData.settings) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'settings'), cleanForFirestore(legacyData.settings)));
      if (legacyData.animations) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'animations'), cleanForFirestore(legacyData.animations)));
      if (legacyData.adminAuth) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'auth'), cleanForFirestore(legacyData.adminAuth)));

      const processList = (list: any[], type: string) => {
        if (Array.isArray(list)) {
          list.forEach(item => {
            const id = item.id || `${type}-${Date.now()}-${Math.random()}`;
            tasks.push(setDoc(doc(firestoreDb, 'items', id), cleanForFirestore({ id, type, title: item.title || 'Untitled', data: item })));
          });
        }
      };

      processList(legacyData.courses, 'course');
      processList(legacyData.books, 'book');
      processList(legacyData.strategies, 'strategy');
      processList(legacyData.portfolio, 'portfolio');
      processList(legacyData.links, 'link');

      await Promise.allSettled(tasks);
      console.log('[Database] Legacy data successfully migrated.');
    } catch (err) {
      console.error('[Database] Migration failed:', err);
    }
  }

  public sanitizeData(data: DatabaseSchema): void {
    if (!data) return;
    const processItem = (item: any, key: string, prefix: string) => {
      if (item && item[key]?.startsWith('data:')) {
        item[key] = saveBase64ToDisk(item[key], prefix);
      }
    };

    if (data.settings) {
      processItem(data.settings, 'logoUrl', 'logo');
      processItem(data.settings, 'profileImageUrl', 'profile');
      processItem(data.settings, 'heroBannerUrl', 'banner');
    }
    data.courses?.forEach(c => processItem(c, 'coverImage', 'course'));
    data.portfolio?.forEach(p => processItem(p, 'screenshotUrl', 'portfolio'));
    data.strategies?.forEach(s => processItem(s, 'imageUrl', 'strategy'));
    data.books?.forEach(b => {
      processItem(b, 'coverImage', 'book_cover');
      processItem(b, 'pdfUrl', 'book_pdf');
    });
  }

  /**
   * Save a single item directly to Firestore
   */
  public async saveItemDirect(item: { id: string; type: string; title: string; data: any }): Promise<void> {
    if (!firestoreDb) return;
    try {
      if (item && item.data) {
        const fileKeys = ['coverImage', 'imageUrl', 'screenshotUrl', 'pdfUrl', 'logoUrl', 'profileImageUrl'];
        for (const k of fileKeys) {
          if (typeof item.data[k] === 'string' && item.data[k].startsWith('data:')) {
            item.data[k] = saveBase64ToDisk(item.data[k], `${item.type}_${k}`);
          }
        }
      }
      const cleaned = cleanForFirestore(item);
      await setDoc(doc(firestoreDb, 'items', item.id), cleaned);
      console.log(`[Firestore Direct] Saved item ${item.id} (${item.type}) to Firestore.`);
    } catch (err: any) {
      console.warn(`[Firestore Direct] Error saving item ${item.id}:`, err?.message || err);
    }
  }

  /**
   * Directly delete an item from Firestore
   */
  public async deleteItemDirect(itemId: string): Promise<void> {
    const targetId = String(itemId).trim();
    // 1. Remove from in-memory arrays
    this.data.courses = (this.data.courses || []).filter(c => c.id !== targetId);
    this.data.books = (this.data.books || []).filter(b => b.id !== targetId);
    this.data.strategies = (this.data.strategies || []).filter(s => s.id !== targetId);
    this.data.portfolio = (this.data.portfolio || []).filter(p => p.id !== targetId);
    this.data.links = (this.data.links || []).filter(l => l.id !== targetId);
    this.saveToLocalFile();

    // 2. Delete permanently from Firestore items collection
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'items', targetId));
        console.log(`[Firestore Direct] Deleted item ${targetId} from Firestore.`);
      } catch (err: any) {
        console.warn(`[Firestore Direct] Error deleting item ${targetId}:`, err?.message || err);
      }
    }
  }

  /**
   * Directly delete a submission from Firestore
   */
  public async deleteSubmissionDirect(subId: string): Promise<void> {
    const targetId = String(subId).trim();
    this.data.submissions = (this.data.submissions || []).filter(s => s.id !== targetId);
    this.saveToLocalFile();

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'submissions', targetId));
        console.log(`[Firestore Direct] Deleted submission ${targetId} from Firestore.`);
      } catch (err: any) {
        console.warn(`[Firestore Direct] Error deleting submission ${targetId}:`, err?.message || err);
      }
    }
  }

  /**
   * Directly save configuration document to Firestore
   */
  public async saveConfigDirect(configName: 'settings' | 'animations' | 'auth', configData: any): Promise<void> {
    if (!firestoreDb) return;
    try {
      await setDoc(doc(firestoreDb, 'app_config', configName), cleanForFirestore(configData));
      console.log(`[Firestore Direct] Saved config ${configName} to Firestore.`);
    } catch (err: any) {
      console.warn(`[Firestore Direct] Error saving config ${configName}:`, err?.message || err);
    }
  }

  private async saveToFirestore(data: DatabaseSchema) {
    if (!firestoreDb) return;
    try {
      this.sanitizeData(data);
      const tasks: Promise<any>[] = [];

      // 1. Config documents
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'settings'), cleanForFirestore(data.settings)).catch(() => {}));
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'animations'), cleanForFirestore(data.animations)).catch(() => {}));
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'auth'), cleanForFirestore(data.adminAuth)).catch(() => {}));

      // 2. Item documents
      const allItems = [
        ...(data.courses || []).map(i => ({ id: i.id, type: 'course', title: i.title, data: i })),
        ...(data.books || []).map(i => ({ id: i.id, type: 'book', title: i.title, data: i })),
        ...(data.strategies || []).map(i => ({ id: i.id, type: 'strategy', title: i.title, data: i })),
        ...(data.portfolio || []).map(i => ({ id: i.id, type: 'portfolio', title: i.title, data: i })),
        ...(data.links || []).map(i => ({ id: i.id, type: 'link', title: i.title, data: i }))
      ];

      for (const item of allItems) {
        tasks.push(setDoc(doc(firestoreDb, 'items', item.id), cleanForFirestore(item)).catch(e => {
          console.warn(`[Firestore] Failed to write item ${item.id}:`, e?.message || e);
        }));
      }

      // 3. Submissions and logs (Recent only)
      for (const sub of (data.submissions || []).slice(0, 15)) {
        tasks.push(setDoc(doc(firestoreDb, 'submissions', sub.id), cleanForFirestore(sub)).catch(() => {}));
      }
      for (const log of (data.auditLogs || []).slice(0, 15)) {
        tasks.push(setDoc(doc(firestoreDb, 'audit_logs', log.id), cleanForFirestore(log)).catch(() => {}));
      }

      await Promise.allSettled(tasks);

      // 4. Cleanup: Delete orphans
      try {
        const itemsCollection = collection(firestoreDb, 'items');
        const allFirestoreItems = await getDocs(itemsCollection);
        const currentItemIds = new Set(allItems.map(i => i.id));
        
        for (const d of allFirestoreItems.docs) {
          if (!currentItemIds.has(d.id)) {
            await deleteDoc(doc(firestoreDb, 'items', d.id)).catch(() => {});
          }
        }
      } catch {}

      console.log(`[Firestore Sync] Successfully synchronized database. Total items: ${allItems.length}`);
    } catch (err: any) {
      console.error('[Firestore Sync] Save failed:', err?.message || err);
    }
  }

  private loadFromFile(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          ...INITIAL_DATA,
          ...parsed,
          courses: (parsed.courses && parsed.courses.length > 0) ? parsed.courses : INITIAL_DATA.courses,
          links: (parsed.links && parsed.links.length > 0) ? parsed.links : INITIAL_DATA.links,
          books: (parsed.books && parsed.books.length > 0) ? parsed.books : INITIAL_DATA.books,
          strategies: (parsed.strategies && parsed.strategies.length > 0) ? parsed.strategies : INITIAL_DATA.strategies,
          portfolio: (parsed.portfolio && parsed.portfolio.length > 0) ? parsed.portfolio : INITIAL_DATA.portfolio,
          settings: { ...INITIAL_DATA.settings, ...(parsed.settings || {}) },
          animations: { ...INITIAL_DATA.animations, ...(parsed.animations || {}) },
          adminAuth: { ...INITIAL_DATA.adminAuth, ...(parsed.adminAuth || {}) }
        };
      }
    } catch {}
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  public saveToLocalFile() {
    try {
      const jsonStr = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DATA_FILE_PATH, jsonStr, 'utf-8');
      fs.writeFileSync(TMP_DATA_PATH, jsonStr, 'utf-8');
    } catch {}
  }

  public async get(): Promise<DatabaseSchema> {
    await this.initPromise;
    return this.data;
  }

  public async update(updater: (data: DatabaseSchema) => void): Promise<DatabaseSchema> {
    await this.initPromise;
    return new Promise<DatabaseSchema>((resolve, reject) => {
      this.updateQueue = this.updateQueue.then(async () => {
        try {
          updater(this.data);
          this.saveToLocalFile();
          await this.saveToFirestore(this.data);
          resolve(this.data);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async logAction(action: string, details: string, ip?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action, 
      details, 
      timestamp: new Date().toISOString(), 
      ip: ip || '127.0.0.1'
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 50) this.data.auditLogs.pop();
    this.saveToLocalFile();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'audit_logs', log.id), cleanForFirestore(log)).catch(() => {});
    }
  }
}

export const db = new Database();
