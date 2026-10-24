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
  orderBy, 
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

let firestoreDb: any = null;
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

const UPLOADS_DIR = (() => {
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

export function saveBase64ToDisk(dataUrl: string, prefix: string, forceDisk: boolean = false): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;
    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeKb = buffer.length / 1024;

    // CRITICAL: We only save to disk if the file is extremely large (>950KB) 
    // because Firestore documents have a 1MB limit.
    // Files under 950KB are now kept in Firestore (PERMANENT) because they will have their own documents.
    if (!forceDisk && sizeKb < 950) {
      return dataUrl;
    }

    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('pdf')) ext = 'pdf';

    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(targetPath, buffer);
    console.log(`[Upload] File too large for database (${Math.round(sizeKb)} KB). Saved to EPHEMERAL disk: /uploads/${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.warn('[Upload] Failed to convert base64 to file:', err);
    return dataUrl;
  }
}

// Interfaces maintain consistency with the rest of the app
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
    tagline: "Institutional Precision. High-Probability Trading Education.",
    heroTitle: "Master Trading With Jahid",
    heroSubtitle: "Institutional-grade Binary & Forex trading education, high-probability algorithmic signals, quantitative bots, and an exclusive community of elite traders.",
    heroTitlePrimary: "Master The Markets With",
    heroTitleHighlight: "Professional Precision",
    heroBadgeText: "Elite Trading Mastery & VIP Signals",
    coursesBadgeText: "Trading Curriculum & Tools · Structured Path",
    coursesTitlePrimary: "Comprehensive Courses,",
    coursesTitleHighlight: "Algorithmic Bots & Signals",
    coursesSubtitle: "Eliminate guesswork with institutional methodologies.",
    profileImageUrl: "/images/jahid_profile_avatar_1791906596676.jpg",
    logoUrl: "/images/trading_with_jahid_logo_1791908793141.jpg",
    heroBannerUrl: "/images/hero_trading_terminal_1791906597313.jpg",
    telegramCommunityUrl: "https://t.me/tradewithjahid",
    telegramAdminUrl: "https://t.me/tradewithjahid",
    contactEmail: "mentor@tradewithjahid.com",
    whatsappUrl: "https://wa.me/message/TRADINGWITHJAHID",
    primaryColor: "#00D084",
    secondaryColor: "#087F5B",
    accentGold: "#D4AF37",
    bgColor: "#080B0A",
    aboutBio: "Professional financial trader, market technician, and trading mentor with over 7 years of experience.",
    aboutJourney: "Developing systematic rule-based setups that transform everyday traders into calculated market operators.",
    aboutExpertise: [
      "Binary Options Candlestick Psychology",
      "Institutional Forex Liquidity (SMC)",
      "High-Frequency Risk Management"
    ],
    aboutStats: [
      { label: "Community Members", value: "14,800+" },
      { label: "Verified Win Rate", value: "84.2%" }
    ],
    footerDisclaimer: "Trading With Jahid is an independent educational academy. All content is for educational purposes.",
    riskNotice: "High Risk Warning: Trading carries a high level of risk to your capital."
  },
  animations: {
    enable3D: true, enableParticles: true, enableCharts: true, enableCursor: true,
    enableScroll: true, intensity: 'medium', speed: 1.0, particleDensity: 75,
    backgroundStyle: 'emerald_mesh', enableOnMobile: false
  },
  courses: [],
  links: [],
  submissions: [],
  portfolio: [],
  books: [],
  strategies: [],
  auditLogs: [],
  adminAuth: {
    username: "admin",
    passwordHash: "jahidvip2026",
    sessionTokens: []
  }
};

function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
}

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
      console.log('[Database] Synchronizing with multi-document collections...');
      
      // 1. Check for legacy single-document data (MIGRATION)
      const legacyRef = doc(firestoreDb, 'app_state', 'main');
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists()) {
        const raw = legacySnap.data();
        if (raw && raw.payloadString) {
          console.log('[Database] Found legacy data. Migrating to new structure...');
          const legacyData = JSON.parse(raw.payloadString);
          await this.migrateLegacyData(legacyData);
          // Delete legacy doc to prevent double migration
          await deleteDoc(legacyRef).catch(() => {});
        }
      }

      // 2. Load Config documents
      const [settingsSnap, animationsSnap, authSnap] = await Promise.all([
        getDoc(doc(firestoreDb, 'app_config', 'settings')),
        getDoc(doc(firestoreDb, 'app_config', 'animations')),
        getDoc(doc(firestoreDb, 'app_config', 'auth'))
      ]);

      if (settingsSnap.exists()) this.data.settings = { ...this.data.settings, ...settingsSnap.data() };
      if (animationsSnap.exists()) this.data.animations = { ...this.data.animations, ...animationsSnap.data() };
      if (authSnap.exists()) this.data.adminAuth = { ...this.data.adminAuth, ...authSnap.data() };

      // 3. Load Items (Courses, Books, Strategies, Portfolio)
      const itemsSnap = await getDocs(collection(firestoreDb, 'items'));
      const items: any[] = [];
      itemsSnap.forEach(doc => items.push(doc.data()));
      
      this.data.courses = items.filter(i => i.type === 'course').map(i => i.data).sort((a,b) => a.order - b.order);
      this.data.books = items.filter(i => i.type === 'book').map(i => i.data).sort((a,b) => a.order - b.order);
      this.data.strategies = items.filter(i => i.type === 'strategy').map(i => i.data).sort((a,b) => a.order - b.order);
      this.data.portfolio = items.filter(i => i.type === 'portfolio').map(i => i.data).sort((a,b) => a.order - b.order);
      
      // 4. Load Links (special case, keep them in settings doc usually but let's use items for consistency)
      this.data.links = items.filter(i => i.type === 'link').map(i => i.data).sort((a,b) => a.order - b.order);

      // 5. Load Submissions and Logs (limited to recent for performance)
      const subsSnap = await getDocs(query(collection(firestoreDb, 'submissions'), limit(200)));
      this.data.submissions = subsSnap.docs.map(d => d.data() as AccountSubmission).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const logsSnap = await getDocs(query(collection(firestoreDb, 'audit_logs'), limit(50)));
      this.data.auditLogs = logsSnap.docs.map(d => d.data() as AuditLog).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.saveToLocalFile();
      console.log('[Database] Multi-document sync complete.');
    } catch (e: any) {
      console.warn('[Database] Sync failed:', e?.message || e);
    }
  }

  private async migrateLegacyData(legacyData: any) {
    if (!firestoreDb) return;
    try {
      const tasks: Promise<void>[] = [];
      
      // Config
      if (legacyData.settings) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'settings'), removeUndefined(legacyData.settings)));
      if (legacyData.animations) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'animations'), removeUndefined(legacyData.animations)));
      if (legacyData.adminAuth) tasks.push(setDoc(doc(firestoreDb, 'app_config', 'auth'), removeUndefined(legacyData.adminAuth)));

      // Items
      const processList = (list: any[], type: string) => {
        if (Array.isArray(list)) {
          list.forEach(item => {
            const id = item.id || `${type}-${Date.now()}-${Math.random()}`;
            tasks.push(setDoc(doc(firestoreDb, 'items', id), removeUndefined({ id, type, title: item.title || 'Untitled', data: item })));
          });
        }
      };

      processList(legacyData.courses, 'course');
      processList(legacyData.books, 'book');
      processList(legacyData.strategies, 'strategy');
      processList(legacyData.portfolio, 'portfolio');
      processList(legacyData.links, 'link');

      // Submissions
      if (Array.isArray(legacyData.submissions)) {
        legacyData.submissions.slice(0, 100).forEach((s: any) => {
          tasks.push(setDoc(doc(firestoreDb, 'submissions', s.id), removeUndefined(s)));
        });
      }

      await Promise.all(tasks);
      console.log('[Database] Legacy data successfully migrated.');
    } catch (err) {
      console.error('[Database] Migration failed:', err);
    }
  }

  public sanitizeData(data: DatabaseSchema): void {
    if (!data) return;
    // We increase threshold because items are individual docs now
    const processItem = (item: any, key: string, prefix: string) => {
      if (item[key]?.startsWith('data:')) {
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

  private async saveToFirestore(data: DatabaseSchema) {
    if (!firestoreDb) return;
    try {
      this.sanitizeData(data);
      const tasks: Promise<void>[] = [];

      // 1. Config documents
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'settings'), removeUndefined(data.settings)));
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'animations'), removeUndefined(data.animations)));
      tasks.push(setDoc(doc(firestoreDb, 'app_config', 'auth'), removeUndefined(data.adminAuth)));

      // 2. Item documents
      const allItems = [
        ...data.courses.map(i => ({ id: i.id, type: 'course', title: i.title, data: i })),
        ...data.books.map(i => ({ id: i.id, type: 'book', title: i.title, data: i })),
        ...data.strategies.map(i => ({ id: i.id, type: 'strategy', title: i.title, data: i })),
        ...data.portfolio.map(i => ({ id: i.id, type: 'portfolio', title: i.title, data: i })),
        ...data.links.map(i => ({ id: i.id, type: 'link', title: i.title, data: i }))
      ];

      for (const item of allItems) {
        tasks.push(setDoc(doc(firestoreDb, 'items', item.id), removeUndefined(item)));
      }

      // 3. Submissions and logs (Recent only)
      for (const sub of data.submissions.slice(0, 10)) {
        tasks.push(setDoc(doc(firestoreDb, 'submissions', sub.id), removeUndefined(sub)));
      }
      for (const log of data.auditLogs.slice(0, 10)) {
        tasks.push(setDoc(doc(firestoreDb, 'audit_logs', log.id), removeUndefined(log)));
      }

      await Promise.all(tasks);

      // 4. Cleanup: Delete orphans
      const itemsCollection = collection(firestoreDb, 'items');
      const allFirestoreItems = await getDocs(itemsCollection);
      const currentItemIds = new Set(allItems.map(i => i.id));
      
      const deleteTasks: Promise<void>[] = [];
      let deleteCount = 0;
      for (const d of allFirestoreItems.docs) {
        if (!currentItemIds.has(d.id)) {
          deleteTasks.push(deleteDoc(doc(firestoreDb, 'items', d.id)));
          deleteCount++;
        }
      }
      if (deleteCount > 0) await Promise.all(deleteTasks);

      console.log(`[Firestore Lite] Successfully synchronized database. Saved ${allItems.length} items, cleaned ${deleteCount} orphans.`);
    } catch (err) {
      console.error('[Firestore Lite] Save failed:', err);
    }
  }

  private loadFromFile(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return { ...INITIAL_DATA, ...parsed };
      }
    } catch {}
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private saveToLocalFile() {
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
      ip: ip || undefined // Firestore helper will remove this if undefined
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 50) this.data.auditLogs.pop();
    this.saveToLocalFile();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'audit_logs', log.id), removeUndefined(log)).catch(() => {});
    }
  }
}

export const db = new Database();
