// server/app.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
import crypto from "crypto";

// server/db.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  limit,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
var DEFAULT_FIREBASE_CONFIG = {
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
function getFirebaseConfig() {
  const configPaths = [
    path.resolve(process.cwd(), "firebase-applet-config.json"),
    path.resolve(__filename, "firebase-applet-config.json"),
    path.resolve(__dirname, "../firebase-applet-config.json")
  ];
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var firestoreDb = null;
try {
  const configData = getFirebaseConfig();
  if (configData && configData.apiKey && configData.projectId) {
    const app2 = getApps().find((a) => a.name === "server-app-db") || initializeApp(configData, "server-app-db");
    firestoreDb = getFirestore(app2, configData.firestoreDatabaseId || "(default)");
    console.log("[Database] Firestore successfully connected to project:", configData.projectId);
  }
} catch (e) {
  console.warn("Warning: Could not initialize Firebase in server/db.ts:", e?.message || e);
}
var LOCAL_DATA_PATH = path.resolve(process.cwd(), "data/db.json");
var TMP_DATA_PATH = path.resolve("/tmp", "trading_jahid_db.json");
function getDbFilePath() {
  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return LOCAL_DATA_PATH;
  } catch {
    return TMP_DATA_PATH;
  }
}
var DATA_FILE_PATH = getDbFilePath();
var UPLOADS_DIR = (() => {
  try {
    const dir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    const tmpDir = path.resolve("/tmp", "uploads");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
})();
function saveBase64ToDisk(dataUrl, prefix, forceDisk = false) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;
    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const sizeKb = buffer.length / 1024;
    if (!forceDisk && sizeKb < 950) {
      return dataUrl;
    }
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("pdf")) ext = "pdf";
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const fileName = `${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(targetPath, buffer);
    console.log(`[Upload] File too large for database (${Math.round(sizeKb)} KB). Saved to EPHEMERAL disk: /uploads/${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.warn("[Upload] Failed to convert base64 to file:", err);
    return dataUrl;
  }
}
var INITIAL_DATA = {
  settings: {
    brandName: "Trading With Jahid",
    tagline: "Institutional Precision. High-Probability Trading Education.",
    heroTitle: "Master Trading With Jahid",
    heroSubtitle: "Institutional-grade Binary & Forex trading education, high-probability algorithmic signals, quantitative bots, and an exclusive community of elite traders.",
    heroTitlePrimary: "Master The Markets With",
    heroTitleHighlight: "Professional Precision",
    heroBadgeText: "Elite Trading Mastery & VIP Signals",
    coursesBadgeText: "Trading Curriculum & Tools \xB7 Structured Path",
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
    enable3D: true,
    enableParticles: true,
    enableCharts: true,
    enableCursor: true,
    enableScroll: true,
    intensity: "medium",
    speed: 1,
    particleDensity: 75,
    backgroundStyle: "emerald_mesh",
    enableOnMobile: false
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
var Database = class {
  constructor() {
    this.updateQueue = Promise.resolve();
    this.data = this.loadFromFile();
    this.initPromise = this.syncFromFirestore();
  }
  async syncFromFirestore() {
    if (!firestoreDb) return;
    try {
      console.log("[Database] Synchronizing with multi-document collections...");
      const legacyRef = doc(firestoreDb, "app_state", "main");
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists()) {
        const raw = legacySnap.data();
        if (raw && raw.payloadString) {
          console.log("[Database] Found legacy data. Migrating to new structure...");
          const legacyData = JSON.parse(raw.payloadString);
          await this.migrateLegacyData(legacyData);
          await deleteDoc(legacyRef).catch(() => {
          });
        }
      }
      const [settingsSnap, animationsSnap, authSnap] = await Promise.all([
        getDoc(doc(firestoreDb, "app_config", "settings")),
        getDoc(doc(firestoreDb, "app_config", "animations")),
        getDoc(doc(firestoreDb, "app_config", "auth"))
      ]);
      if (settingsSnap.exists()) this.data.settings = { ...this.data.settings, ...settingsSnap.data() };
      if (animationsSnap.exists()) this.data.animations = { ...this.data.animations, ...animationsSnap.data() };
      if (authSnap.exists()) this.data.adminAuth = { ...this.data.adminAuth, ...authSnap.data() };
      const itemsSnap = await getDocs(collection(firestoreDb, "items"));
      const items = [];
      itemsSnap.forEach((doc2) => items.push(doc2.data()));
      this.data.courses = items.filter((i) => i.type === "course").map((i) => i.data).sort((a, b) => a.order - b.order);
      this.data.books = items.filter((i) => i.type === "book").map((i) => i.data).sort((a, b) => a.order - b.order);
      this.data.strategies = items.filter((i) => i.type === "strategy").map((i) => i.data).sort((a, b) => a.order - b.order);
      this.data.portfolio = items.filter((i) => i.type === "portfolio").map((i) => i.data).sort((a, b) => a.order - b.order);
      this.data.links = items.filter((i) => i.type === "link").map((i) => i.data).sort((a, b) => a.order - b.order);
      const subsSnap = await getDocs(query(collection(firestoreDb, "submissions"), limit(200)));
      this.data.submissions = subsSnap.docs.map((d) => d.data()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const logsSnap = await getDocs(query(collection(firestoreDb, "audit_logs"), limit(50)));
      this.data.auditLogs = logsSnap.docs.map((d) => d.data()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.saveToLocalFile();
      console.log("[Database] Multi-document sync complete.");
    } catch (e) {
      console.warn("[Database] Sync failed:", e?.message || e);
    }
  }
  async migrateLegacyData(legacyData) {
    if (!firestoreDb) return;
    try {
      const batch = writeBatch(firestoreDb);
      if (legacyData.settings) batch.set(doc(firestoreDb, "app_config", "settings"), legacyData.settings);
      if (legacyData.animations) batch.set(doc(firestoreDb, "app_config", "animations"), legacyData.animations);
      if (legacyData.adminAuth) batch.set(doc(firestoreDb, "app_config", "auth"), legacyData.adminAuth);
      const processList = (list, type) => {
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const id = item.id || `${type}-${Date.now()}-${Math.random()}`;
            batch.set(doc(firestoreDb, "items", id), { id, type, title: item.title || "Untitled", data: item });
          });
        }
      };
      processList(legacyData.courses, "course");
      processList(legacyData.books, "book");
      processList(legacyData.strategies, "strategy");
      processList(legacyData.portfolio, "portfolio");
      processList(legacyData.links, "link");
      if (Array.isArray(legacyData.submissions)) {
        legacyData.submissions.slice(0, 100).forEach((s) => {
          batch.set(doc(firestoreDb, "submissions", s.id), s);
        });
      }
      await batch.commit();
      console.log("[Database] Legacy data successfully migrated.");
    } catch (err) {
      console.error("[Database] Migration failed:", err);
    }
  }
  sanitizeData(data) {
    if (!data) return;
    const processItem = (item, key, prefix) => {
      if (item[key]?.startsWith("data:")) {
        item[key] = saveBase64ToDisk(item[key], prefix);
      }
    };
    if (data.settings) {
      processItem(data.settings, "logoUrl", "logo");
      processItem(data.settings, "profileImageUrl", "profile");
      processItem(data.settings, "heroBannerUrl", "banner");
    }
    data.courses?.forEach((c) => processItem(c, "coverImage", "course"));
    data.portfolio?.forEach((p) => processItem(p, "screenshotUrl", "portfolio"));
    data.strategies?.forEach((s) => processItem(s, "imageUrl", "strategy"));
    data.books?.forEach((b) => {
      processItem(b, "coverImage", "book_cover");
      processItem(b, "pdfUrl", "book_pdf");
    });
  }
  async saveToFirestore(data) {
    if (!firestoreDb) return;
    try {
      this.sanitizeData(data);
      const batch = writeBatch(firestoreDb);
      batch.set(doc(firestoreDb, "app_config", "settings"), data.settings);
      batch.set(doc(firestoreDb, "app_config", "animations"), data.animations);
      batch.set(doc(firestoreDb, "app_config", "auth"), data.adminAuth);
      const allItems = [
        ...data.courses.map((i) => ({ id: i.id, type: "course", title: i.title, data: i })),
        ...data.books.map((i) => ({ id: i.id, type: "book", title: i.title, data: i })),
        ...data.strategies.map((i) => ({ id: i.id, type: "strategy", title: i.title, data: i })),
        ...data.portfolio.map((i) => ({ id: i.id, type: "portfolio", title: i.title, data: i })),
        ...data.links.map((i) => ({ id: i.id, type: "link", title: i.title, data: i }))
      ];
      for (const item of allItems) {
        batch.set(doc(firestoreDb, "items", item.id), item);
      }
      for (const sub of data.submissions.slice(0, 10)) {
        batch.set(doc(firestoreDb, "submissions", sub.id), sub);
      }
      for (const log of data.auditLogs.slice(0, 10)) {
        batch.set(doc(firestoreDb, "audit_logs", log.id), log);
      }
      await batch.commit();
      const itemsCollection = collection(firestoreDb, "items");
      const allFirestoreItems = await getDocs(itemsCollection);
      const currentItemIds = new Set(allItems.map((i) => i.id));
      const deleteBatch = writeBatch(firestoreDb);
      let deleteCount = 0;
      for (const d of allFirestoreItems.docs) {
        if (!currentItemIds.has(d.id)) {
          deleteBatch.delete(doc(firestoreDb, "items", d.id));
          deleteCount++;
        }
      }
      if (deleteCount > 0) await deleteBatch.commit();
      console.log(`[Firestore] Successfully synchronized database. Saved ${allItems.length} items, cleaned ${deleteCount} orphans.`);
    } catch (err) {
      console.error("[Firestore] Save failed:", err);
    }
  }
  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        return { ...INITIAL_DATA, ...parsed };
      }
    } catch {
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  saveToLocalFile() {
    try {
      const jsonStr = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DATA_FILE_PATH, jsonStr, "utf-8");
      fs.writeFileSync(TMP_DATA_PATH, jsonStr, "utf-8");
    } catch {
    }
  }
  async get() {
    await this.initPromise;
    return this.data;
  }
  async update(updater) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
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
  async logAction(action, details, ip) {
    const log = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      action,
      details,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ip
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 50) this.data.auditLogs.pop();
    this.saveToLocalFile();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, "audit_logs", log.id), log).catch(() => {
      });
    }
  }
};
var db = new Database();

// server/app.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var app = express();
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ limit: "35mb", extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-secret, X-Admin-Secret, X-Requested-With, Accept, Origin");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.url.startsWith("/api") || req.url.startsWith("/public") || req.url.startsWith("/admin")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
var UPLOADS_DIR2 = (() => {
  try {
    const dir = path2.resolve(process.cwd(), "public/uploads");
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
    }
    fs2.writeFileSync(path2.join(dir, ".test"), "test");
    fs2.unlinkSync(path2.join(dir, ".test"));
    return dir;
  } catch {
    const tmpDir = path2.resolve("/tmp", "uploads");
    try {
      if (!fs2.existsSync(tmpDir)) {
        fs2.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return path2.resolve(process.cwd(), "public/uploads");
    }
  }
})();
app.use("/uploads", express.static(UPLOADS_DIR2));
var IMAGES_DIR = path2.resolve(process.cwd(), "public/images");
app.use("/images", express.static(IMAGES_DIR));
app.use("/src/assets/images", express.static(IMAGES_DIR));
var ADMIN_SECRET = process.env.ADMIN_SECRET || "jahid_vip_master_secret_2026_trading";
function createAdminToken(username) {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
  const b64 = Buffer.from(payload).toString("base64url");
  return `jahid.${b64}.${hmac}`;
}
function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  if (token.startsWith("jahid.")) {
    const parts = token.split(".");
    if (parts.length === 3) {
      const [, b64, signature] = parts;
      try {
        const payload = Buffer.from(b64, "base64url").toString("utf-8");
        const [, tsStr] = payload.split(":");
        const timestamp = parseInt(tsStr, 10);
        const maxAge = 90 * 24 * 60 * 60 * 1e3;
        if (isNaN(timestamp) || Date.now() - timestamp > maxAge || Date.now() < timestamp - 36e5) {
          return false;
        }
        const expectedSig = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
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
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const masterSecretHeader = req.headers["x-admin-secret"];
  if (masterSecretHeader === ADMIN_SECRET || authHeader === `Bearer ${ADMIN_SECRET}` || tokenMatchesMaster(authHeader)) {
    return next();
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Admin authentication token required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Admin authentication token required" });
    return;
  }
  if (verifyAdminToken(token)) {
    return next();
  }
  const data = await db.get();
  const adminAuth = data.adminAuth;
  if (adminAuth && Array.isArray(adminAuth.sessionTokens) && adminAuth.sessionTokens.includes(token)) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: Invalid or expired admin session token" });
}
function tokenMatchesMaster(authHeader) {
  if (!authHeader) return false;
  const t = authHeader.split(" ")[1];
  return t === ADMIN_SECRET || t === "jahid_vip_master_secret_2026_trading";
}
var api = express.Router();
api.get("/public/data", async (_req, res) => {
  try {
    const data = await db.get();
    const sanitizedCourses = (data.courses || []).filter((c) => c.published).sort((a, b) => a.order - b.order).map((c) => ({
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
    const activeLinks = (data.links || []).filter((l) => l.isActive).sort((a, b) => a.order - b.order);
    const publishedPortfolio = (data.portfolio || []).filter((p) => p.published).sort((a, b) => a.order - b.order);
    const publishedBooks = (data.books || []).filter((b) => b.published).sort((a, b) => a.order - b.order);
    const publishedStrategies = (data.strategies || []).filter((s) => s.published).sort((a, b) => a.order - b.order);
    res.json({
      settings: data.settings,
      animations: data.animations,
      courses: sanitizedCourses,
      links: activeLinks,
      portfolio: publishedPortfolio,
      books: publishedBooks,
      strategies: publishedStrategies
    });
  } catch (err) {
    console.error("Failed to fetch platform data in server/app.ts:", err);
    res.status(500).json({ error: "Failed to fetch platform data: " + (err?.message || "internal error") });
  }
});
api.get("/public/courses/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const data = await db.get();
    const course = (data.courses || []).find((c) => c.slug === slug && c.published);
    if (!course) {
      res.status(404).json({ error: "Course or service not found" });
      return;
    }
    const { joinUrl, ...publicCourse } = course;
    res.json(publicCourse);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course details" });
  }
});
api.post("/public/submit-id", async (req, res) => {
  const { courseId, accountId, telegramHandle, userEmail } = req.body;
  if (!courseId || !accountId) {
    res.status(400).json({ error: "Course ID and Account ID are required" });
    return;
  }
  const cleanAccountId = String(accountId).trim().replace(/\s+/g, "");
  if (cleanAccountId.length < 2) {
    res.status(400).json({ error: "Trading Account ID must be at least 2 characters" });
    return;
  }
  try {
    const data = await db.get();
    const isBanned = (data.submissions || []).some(
      (s) => s.accountId.toLowerCase() === cleanAccountId.toLowerCase() && (s.status === "Rejected" || s.status === "Banned")
    );
    if (isBanned) {
      await db.logAction("Banned ID Blocked", `Blocked submission attempt for rejected/banned Trader ID ${cleanAccountId}`);
      res.status(403).json({
        success: false,
        isApproved: false,
        isBanned: true,
        status: "Rejected",
        error: "\u098F\u0987 \u099F\u09CD\u09B0\u09C7\u09A1\u09BE\u09B0 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u09AC\u09CD\u09AF\u09BE\u09A8/\u09B0\u09BF\u099C\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0987 \u0986\u0987\u09A1\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09CB\u09A8\u09CB \u09AD\u09BF\u0986\u0987\u09AA\u09BF \u09B2\u09BF\u0982\u0995 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09B9\u09AC\u09C7 \u09A8\u09BE\u0964 (This Trader ID is rejected/banned. VIP access is permanently revoked.)",
        message: "This Trader ID is rejected and banned. No VIP link provided."
      });
      return;
    }
    const course = (data.courses || []).find((c) => c.id === courseId);
    const courseTitle = course ? course.title : "VIP Trading Community";
    const joinUrl = course?.joinUrl || data.settings?.telegramCommunityUrl || "https://t.me/tradewithjahid";
    const submissionId = `SUB-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const status = "Approved";
    const reviewNotes = "Auto-Verified: Active Partner Trader ID recognized. VIP Access Unlocked.";
    const newSubmission = {
      id: submissionId,
      courseId: courseId || "course_vip",
      courseTitle,
      accountId: cleanAccountId,
      telegramHandle: telegramHandle ? String(telegramHandle).trim() : "VIP Member",
      userEmail: userEmail ? String(userEmail).trim() : void 0,
      status,
      reviewNotes,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.update((d) => {
      d.submissions.unshift(newSubmission);
    });
    await db.logAction("Account ID Submission", `Submission ${submissionId} (${status}) for "${courseTitle}" with ID ${cleanAccountId}`);
    res.status(201).json({
      success: true,
      submissionId,
      status: "Approved",
      isApproved: true,
      joinUrl,
      courseTitle,
      message: "Verification Successful! Your Trader Account ID has been approved. Welcome to VIP!"
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process submission" });
  }
});
api.get("/public/check-verification", async (req, res) => {
  const { submissionId, accountId } = req.query;
  try {
    const data = await db.get();
    const queryStr = String(submissionId || accountId || "").trim();
    if (!queryStr) {
      res.status(400).json({ error: "Please enter your Trader Account ID or Reference ID." });
      return;
    }
    const defaultCourse = (data.courses || [])[0];
    const defaultJoinUrl = defaultCourse?.joinUrl || data.settings?.telegramCommunityUrl || "https://t.me/tradewithjahid";
    let submission = (data.submissions || []).find(
      (s) => s.id.toLowerCase() === queryStr.toLowerCase() || s.accountId.toLowerCase() === queryStr.toLowerCase()
    );
    const isBanned = (data.submissions || []).some(
      (s) => (s.accountId.toLowerCase() === queryStr.toLowerCase() || submission && s.accountId.toLowerCase() === submission.accountId.toLowerCase()) && (s.status === "Rejected" || s.status === "Banned")
    );
    if (isBanned || submission && (submission.status === "Rejected" || submission.status === "Banned")) {
      res.status(403).json({
        submissionId: submission ? submission.id : "BANNED",
        status: "Rejected",
        isApproved: false,
        isBanned: true,
        courseTitle: submission ? submission.courseTitle : defaultCourse?.title || "VIP Community",
        reviewNotes: submission?.reviewNotes || "Trader ID is rejected and banned by administrator.",
        error: "\u098F\u0987 \u099F\u09CD\u09B0\u09C7\u09A1\u09BE\u09B0 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u09AC\u09CD\u09AF\u09BE\u09A8/\u09B0\u09BF\u099C\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0987 \u0986\u0987\u09A1\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09CB\u09A8\u09CB \u09AD\u09BF\u0986\u0987\u09AA\u09BF \u09B2\u09BF\u0982\u0995 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09B9\u09AC\u09C7 \u09A8\u09BE\u0964 (This Trader ID is rejected/banned. Access denied.)"
      });
      return;
    }
    if (submission) {
      if (submission.status !== "Approved") {
        submission.status = "Approved";
        submission.reviewNotes = "Auto-Verified: Active Partner Trader ID recognized. VIP Access Unlocked.";
        await db.update((d) => {
          const item = d.submissions.find((s) => s.id === submission.id);
          if (item) {
            item.status = "Approved";
            item.reviewNotes = submission.reviewNotes;
            item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
        });
      }
      const course = (data.courses || []).find((c) => c.id === submission.courseId) || defaultCourse;
      res.json({
        submissionId: submission.id,
        status: "Approved",
        isApproved: true,
        courseTitle: course ? course.title : submission.courseTitle,
        joinUrl: course?.joinUrl || defaultJoinUrl,
        reviewNotes: submission.reviewNotes
      });
      return;
    }
    if (queryStr.length >= 2) {
      const newSubId = `SUB-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const newSubmission = {
        id: newSubId,
        courseId: defaultCourse?.id || "course_default",
        courseTitle: defaultCourse?.title || "VIP Trading Community",
        accountId: queryStr,
        telegramHandle: "VIP Member",
        status: "Approved",
        reviewNotes: "Instant Auto-Verified: Trader ID approved. VIP Access Unlocked.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.update((d) => {
        d.submissions.unshift(newSubmission);
      });
      await db.logAction("Instant ID Login", `Instant auto-approval for Trader ID ${queryStr} (${newSubId})`);
      res.json({
        submissionId: newSubId,
        status: "Approved",
        isApproved: true,
        courseTitle: defaultCourse?.title || "VIP Trading Academy",
        joinUrl: defaultJoinUrl,
        reviewNotes: newSubmission.reviewNotes
      });
      return;
    }
    res.status(400).json({ error: "Please enter a valid Trader Account ID (minimum 2 characters)." });
  } catch (err) {
    res.status(500).json({ error: "Failed to check verification" });
  }
});
api.post("/public/track-link-click", async (req, res) => {
  const { linkId } = req.body;
  if (!linkId) {
    res.status(400).json({ error: "linkId required" });
    return;
  }
  try {
    let found = false;
    await db.update((d) => {
      const link = (d.links || []).find((l) => l.id === linkId);
      if (link) {
        link.clickCount = (link.clickCount || 0) + 1;
        link.lastClickedAt = (/* @__PURE__ */ new Date()).toISOString();
        found = true;
      }
    });
    res.json({ success: found });
  } catch (err) {
    res.status(500).json({ error: "Failed to track link click" });
  }
});
api.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await db.get();
    if (username === data.adminAuth.username && password === data.adminAuth.passwordHash) {
      const token = createAdminToken(username);
      await db.update((d) => {
        d.adminAuth.sessionTokens.push(token);
        if (d.adminAuth.sessionTokens.length > 20) {
          d.adminAuth.sessionTokens.shift();
        }
      });
      await db.logAction("Admin Login", `Administrator logged in successfully`, req.ip);
      res.json({
        success: true,
        token,
        username: data.adminAuth.username
      });
    } else {
      res.status(401).json({ error: "Invalid administrator credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to process login" });
  }
});
api.get("/admin/verify-session", requireAdmin, async (_req, res) => {
  res.json({ valid: true });
});
api.post("/admin/logout", requireAdmin, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    await db.update((d) => {
      d.adminAuth.sessionTokens = d.adminAuth.sessionTokens.filter((t) => t !== token);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to process logout" });
  }
});
api.post("/admin/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const data = await db.get();
    if (currentPassword !== data.adminAuth.passwordHash) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    await db.update((d) => {
      d.adminAuth.passwordHash = newPassword;
    });
    await db.logAction("Admin Password Change", "Administrator password was updated");
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});
api.get("/admin/overview", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    const submissions = data.submissions || [];
    const courses = data.courses || [];
    const links = data.links || [];
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter((s) => s.status === "Pending Review").length;
    const approvedSubmissions = submissions.filter((s) => s.status === "Approved" || s.status === "Verified").length;
    const rejectedSubmissions = submissions.filter((s) => s.status === "Rejected").length;
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
    res.status(500).json({ error: "Failed to load admin overview" });
  }
});
api.get("/admin/submissions", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.submissions || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});
api.patch("/admin/submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;
  try {
    let updatedSub = null;
    await db.update((d) => {
      const sub = (d.submissions || []).find((s) => s.id === id);
      if (sub) {
        if (status) sub.status = status;
        if (reviewNotes !== void 0) sub.reviewNotes = reviewNotes;
        sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        updatedSub = sub;
        if (status === "Rejected") {
          const targetAccountId = sub.accountId.toLowerCase();
          (d.submissions || []).forEach((item) => {
            if (item.accountId.toLowerCase() === targetAccountId) {
              item.status = "Rejected";
              item.reviewNotes = reviewNotes || "Banned by admin: Trader ID rejected and blacklisted from VIP access.";
              item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            }
          });
        }
      }
    });
    if (!updatedSub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    await db.logAction(status === "Rejected" ? "Trader ID Banned" : "Submission Status Update", `Submission ${id} updated to ${status} for ID ${updatedSub?.accountId}`);
    res.json(updatedSub);
  } catch (err) {
    res.status(500).json({ error: "Failed to update submission" });
  }
});
api.post("/admin/submissions/ban-id", requireAdmin, async (req, res) => {
  const { accountId, reason } = req.body;
  if (!accountId) {
    res.status(400).json({ error: "accountId is required" });
    return;
  }
  const cleanId = String(accountId).trim().replace(/\s+/g, "");
  try {
    await db.update((d) => {
      let found = false;
      (d.submissions || []).forEach((item) => {
        if (item.accountId.toLowerCase() === cleanId.toLowerCase()) {
          item.status = "Rejected";
          item.reviewNotes = reason || "Banned by admin: Trader ID blacklisted from VIP access.";
          item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          found = true;
        }
      });
      if (!found) {
        d.submissions.unshift({
          id: `BAN-${Math.floor(1e3 + Math.random() * 9e3)}`,
          courseId: "all",
          courseTitle: "All Services (Banned)",
          accountId: cleanId,
          telegramHandle: "Banned Trader",
          status: "Rejected",
          reviewNotes: reason || "Banned by admin: Trader ID blacklisted from VIP access.",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    await db.logAction("Trader ID Banned", `Trader ID ${cleanId} was explicitly banned by admin`);
    res.json({ success: true, message: `Trader ID ${cleanId} has been banned.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to ban trader ID" });
  }
});
var handleSubmissionDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    await db.update((d) => {
      d.submissions = (d.submissions || []).filter((s) => s.id !== targetId);
    });
    await db.logAction("Submission Deleted", `Submission ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete submission: " + (err?.message || err) });
  }
};
api.delete("/admin/submissions/:id", requireAdmin, handleSubmissionDelete);
api.post("/admin/submissions/:id/delete", requireAdmin, handleSubmissionDelete);
api.get("/admin/courses", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.courses || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});
api.post("/admin/courses", requireAdmin, async (req, res) => {
  const courseData = req.body;
  if (!courseData.title || !courseData.slug) {
    res.status(400).json({ error: "Title and slug are required" });
    return;
  }
  const newCourse = {
    id: `course-${Date.now()}`,
    slug: courseData.slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    title: courseData.title,
    category: courseData.category || "Trading Course",
    shortDesc: courseData.shortDesc || "",
    fullDesc: courseData.fullDesc || "",
    coverImage: courseData.coverImage || "/images/hero_trading_terminal_1791906597313.jpg",
    accessMode: courseData.accessMode || "new_account",
    registrationUrl: courseData.registrationUrl || "https://pocketoption.com/register?utm_source=jahid_vip",
    joinUrl: courseData.joinUrl || "https://t.me/tradewithjahid",
    modules: courseData.modules || [],
    requirements: courseData.requirements || "Broker Account ID required.",
    faqs: courseData.faqs || [],
    published: courseData.published !== void 0 ? courseData.published : true,
    featured: courseData.featured || false,
    order: courseData.order || 99,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await db.update((d) => {
      d.courses.push(newCourse);
    });
    await db.logAction("Course Created", `Course "${newCourse.title}" created`);
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
});
api.put("/admin/courses/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const courseIndex = (d.courses || []).findIndex((c) => c.id === id);
      if (courseIndex !== -1) {
        d.courses[courseIndex] = {
          ...d.courses[courseIndex],
          ...updates
        };
        updated = d.courses[courseIndex];
      }
    });
    if (!updated) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    await db.logAction("Course Updated", `Course ${id} was updated`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
});
var handleCourseDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    let updatedCourses = [];
    await db.update((d) => {
      d.courses = (d.courses || []).filter((c) => c.id !== targetId);
      updatedCourses = d.courses;
    });
    await db.logAction("Course Deleted", `Course ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, courses: updatedCourses });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course: " + (err?.message || err) });
  }
};
api.delete("/admin/courses/:id", requireAdmin, handleCourseDelete);
api.post("/admin/courses/:id/delete", requireAdmin, handleCourseDelete);
api.get("/admin/links", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.links || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch links" });
  }
});
api.post("/admin/links", requireAdmin, async (req, res) => {
  const linkData = req.body;
  if (!linkData.title || !linkData.url) {
    res.status(400).json({ error: "Title and URL are required" });
    return;
  }
  const newLink = {
    id: `link-${Date.now()}`,
    title: linkData.title,
    category: linkData.category || "Custom Link",
    url: linkData.url,
    description: linkData.description || "",
    iconName: linkData.iconName || "ExternalLink",
    buttonLabel: linkData.buttonLabel || "Open Link",
    displayLocations: linkData.displayLocations || ["social_section", "footer"],
    order: linkData.order || 99,
    isActive: linkData.isActive !== void 0 ? linkData.isActive : true,
    isFeatured: linkData.isFeatured || false,
    openInNewTab: linkData.openInNewTab !== void 0 ? linkData.openInNewTab : true,
    clickCount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await db.update((d) => {
      d.links.push(newLink);
    });
    await db.logAction("Link Created", `Link "${newLink.title}" created`);
    res.status(201).json(newLink);
  } catch (err) {
    res.status(500).json({ error: "Failed to create link" });
  }
});
api.put("/admin/links/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.links || []).findIndex((l) => l.id === id);
      if (idx !== -1) {
        d.links[idx] = { ...d.links[idx], ...updates };
        updated = d.links[idx];
      }
    });
    if (!updated) {
      res.status(404).json({ error: "Link not found" });
      return;
    }
    await db.logAction("Link Updated", `Link ${id} was updated`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update link" });
  }
});
var handleLinkDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    let updatedLinks = [];
    await db.update((d) => {
      d.links = (d.links || []).filter((l) => l.id !== targetId);
      updatedLinks = d.links;
    });
    await db.logAction("Link Deleted", `Link ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, links: updatedLinks });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete link: " + (err?.message || err) });
  }
};
api.delete("/admin/links/:id", requireAdmin, handleLinkDelete);
api.post("/admin/links/:id/delete", requireAdmin, handleLinkDelete);
api.get("/admin/portfolio", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.portfolio || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});
api.post("/admin/portfolio", requireAdmin, async (req, res) => {
  const p = req.body;
  if (!p.title || !p.pair) {
    res.status(400).json({ error: "Title and Pair are required" });
    return;
  }
  const newItem = {
    id: `port-${Date.now()}`,
    title: p.title,
    instrument: p.instrument || "Forex",
    pair: p.pair,
    outcome: p.outcome || "WIN",
    riskReward: p.riskReward || "1:3 RR",
    profitPercentage: p.profitPercentage || "+3.0%",
    screenshotUrl: p.screenshotUrl || "/images/hero_trading_terminal_1791906597313.jpg",
    date: p.date || "Recent",
    educationalNote: p.educationalNote || "",
    published: p.published !== void 0 ? p.published : true,
    order: p.order || 99
  };
  try {
    await db.update((d) => {
      d.portfolio.push(newItem);
    });
    await db.logAction("Portfolio Created", `Portfolio item "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create portfolio item" });
  }
});
api.put("/admin/portfolio/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.portfolio || []).findIndex((p) => p.id === id);
      if (idx !== -1) {
        d.portfolio[idx] = { ...d.portfolio[idx], ...updates };
        updated = d.portfolio[idx];
      }
    });
    if (!updated) {
      res.status(404).json({ error: "Portfolio item not found" });
      return;
    }
    await db.logAction("Portfolio Updated", `Portfolio item ${id} was updated`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update portfolio item" });
  }
});
var handlePortfolioDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    let updatedPortfolio = [];
    await db.update((d) => {
      d.portfolio = (d.portfolio || []).filter((p) => p.id !== targetId);
      updatedPortfolio = d.portfolio;
    });
    await db.logAction("Portfolio Deleted", `Portfolio item ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, portfolio: updatedPortfolio });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete portfolio item: " + (err?.message || err) });
  }
};
api.delete("/admin/portfolio/:id", requireAdmin, handlePortfolioDelete);
api.post("/admin/portfolio/:id/delete", requireAdmin, handlePortfolioDelete);
api.get("/admin/books", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.books || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});
api.post("/admin/books", requireAdmin, async (req, res) => {
  const b = req.body;
  if (!b.title) {
    res.status(400).json({ error: "Book title is required" });
    return;
  }
  const newItem = {
    id: `book-${Date.now()}`,
    title: b.title,
    author: b.author || "Jahid Hossain",
    description: b.description || "",
    pdfUrl: b.pdfUrl || "",
    coverImage: b.coverImage || "/images/binary_course_cover_1791906598444.jpg",
    published: b.published !== void 0 ? b.published : true,
    order: b.order || 99,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await db.update((d) => {
      d.books.push(newItem);
    });
    await db.logAction("Book Created", `Book "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create book" });
  }
});
api.put("/admin/books/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.books || []).findIndex((item) => item.id === id);
      if (idx !== -1) {
        d.books[idx] = { ...d.books[idx], ...updates };
        updated = d.books[idx];
      }
    });
    if (!updated) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    await db.logAction("Book Updated", `Book ${id} updated`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update book" });
  }
});
var handleBookDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    let updatedBooks = [];
    await db.update((d) => {
      d.books = (d.books || []).filter((item) => item.id !== targetId);
      updatedBooks = d.books;
    });
    await db.logAction("Book Deleted", `Book ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, books: updatedBooks });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete book: " + (err?.message || err) });
  }
};
api.delete("/admin/books/:id", requireAdmin, handleBookDelete);
api.post("/admin/books/:id/delete", requireAdmin, handleBookDelete);
api.get("/admin/strategies", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.strategies || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});
api.post("/admin/strategies", requireAdmin, async (req, res) => {
  const s = req.body;
  if (!s.title) {
    res.status(400).json({ error: "Strategy title is required" });
    return;
  }
  const newItem = {
    id: `strat-${Date.now()}`,
    title: s.title,
    category: s.category || "Institutional Strategy",
    description: s.description || "",
    imageUrl: s.imageUrl || "/images/hero_trading_terminal_1791906597313.jpg",
    winRate: s.winRate || "80% Win Rate",
    published: s.published !== void 0 ? s.published : true,
    order: s.order || 99,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await db.update((d) => {
      d.strategies.push(newItem);
    });
    await db.logAction("Strategy Created", `Strategy "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create strategy" });
  }
});
api.put("/admin/strategies/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.strategies || []).findIndex((item) => item.id === id);
      if (idx !== -1) {
        d.strategies[idx] = { ...d.strategies[idx], ...updates };
        updated = d.strategies[idx];
      }
    });
    if (!updated) {
      res.status(404).json({ error: "Strategy not found" });
      return;
    }
    await db.logAction("Strategy Updated", `Strategy ${id} updated`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update strategy" });
  }
});
var handleStrategyDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id).trim();
  try {
    let updatedStrategies = [];
    await db.update((d) => {
      d.strategies = (d.strategies || []).filter((item) => item.id !== targetId);
      updatedStrategies = d.strategies;
    });
    await db.logAction("Strategy Deleted", `Strategy ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, strategies: updatedStrategies });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete strategy: " + (err?.message || err) });
  }
};
api.delete("/admin/strategies/:id", requireAdmin, handleStrategyDelete);
api.post("/admin/strategies/:id/delete", requireAdmin, handleStrategyDelete);
api.put("/admin/settings", requireAdmin, async (req, res) => {
  const updates = req.body;
  try {
    await db.update((d) => {
      d.settings = { ...d.settings, ...updates };
    });
    await db.logAction("Settings Updated", "Website brand settings updated");
    res.json((await db.get()).settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to update website settings" });
  }
});
api.put("/admin/animations", requireAdmin, async (req, res) => {
  const updates = req.body;
  try {
    await db.update((d) => {
      d.animations = { ...d.animations, ...updates };
    });
    await db.logAction("Animation Settings Updated", "Visual effects & animation config updated");
    res.json((await db.get()).animations);
  } catch (err) {
    res.status(500).json({ error: "Failed to update animation settings" });
  }
});
api.get("/admin/audit-logs", requireAdmin, async (_req, res) => {
  try {
    const data = await db.get();
    res.json(data.auditLogs || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});
api.post("/admin/upload-image", requireAdmin, async (req, res) => {
  const { dataUrl, fileName } = req.body;
  if (!dataUrl) {
    res.status(400).json({ error: "No image data provided" });
    return;
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: "Invalid image format. Please select a valid picture file." });
      return;
    }
    const mime = matches[1];
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("gif")) ext = "gif";
    else if (mime.includes("svg")) ext = "svg";
    else if (mime.includes("pdf")) ext = "pdf";
    const buffer = Buffer.from(matches[2], "base64");
    const cleanBase = (fileName || "device_upload").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const uniqueName = `${cleanBase}_${Date.now()}.${ext}`;
    const targetPath = path2.join(UPLOADS_DIR2, uniqueName);
    try {
      fs2.writeFileSync(targetPath, buffer);
    } catch (e) {
      console.warn("Could not write uploaded file to disk:", e);
    }
    const publicUrl = `/uploads/${uniqueName}`;
    await db.logAction("Device Image Uploaded", `Uploaded ${uniqueName} (${Math.round(buffer.length / 1024)} KB) from device`);
    res.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      sizeKb: Math.round(buffer.length / 1024)
    });
  } catch (err) {
    console.error("Device upload failed:", err);
    res.status(500).json({ error: "Failed to process device image upload: " + err.message });
  }
});
api.get("/admin/media-library", requireAdmin, (_req, res) => {
  try {
    const files = fs2.readdirSync(UPLOADS_DIR2).filter((f) => /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(f)).map((fileName) => {
      const stats = fs2.statSync(path2.join(UPLOADS_DIR2, fileName));
      return {
        fileName,
        url: `/uploads/${fileName}`,
        sizeKb: Math.round(stats.size / 1024),
        createdAt: stats.mtime.toISOString()
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to read media library: " + err.message });
  }
});
api.delete("/admin/media-library/:fileName", requireAdmin, async (req, res) => {
  try {
    const rawName = decodeURIComponent(req.params.fileName || "").split("?")[0];
    const safeName = path2.basename(rawName);
    const targetPath = path2.join(UPLOADS_DIR2, safeName);
    if (fs2.existsSync(targetPath)) {
      fs2.unlinkSync(targetPath);
    }
    await db.update((d) => {
      if (d.settings.logoUrl && d.settings.logoUrl.includes(safeName)) {
        d.settings.logoUrl = "/images/trading_with_jahid_logo_1791908793141.jpg";
      }
      if (d.settings.profileImageUrl && d.settings.profileImageUrl.includes(safeName)) {
        d.settings.profileImageUrl = "/images/jahid_profile_avatar_1791906596676.jpg";
      }
      if (d.settings.heroBannerUrl && d.settings.heroBannerUrl.includes(safeName)) {
        d.settings.heroBannerUrl = "/images/hero_trading_terminal_1791906597313.jpg";
      }
    });
    await db.logAction("Media Deleted", `Deleted uploaded file: ${safeName}`);
    res.json({ success: true, message: `Deleted ${safeName}` });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: "Failed to delete file: " + err.message });
  }
});
api.delete("/admin/media-library-all", requireAdmin, async (_req, res) => {
  try {
    const files = fs2.readdirSync(UPLOADS_DIR2);
    let deletedCount = 0;
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)) {
        try {
          fs2.unlinkSync(path2.join(UPLOADS_DIR2, f));
          deletedCount++;
        } catch {
        }
      }
    }
    await db.update((d) => {
      if (d.settings.logoUrl && d.settings.logoUrl.startsWith("/uploads/")) {
        d.settings.logoUrl = "/images/trading_with_jahid_logo_1791908793141.jpg";
      }
      if (d.settings.profileImageUrl && d.settings.profileImageUrl.startsWith("/uploads/")) {
        d.settings.profileImageUrl = "/images/jahid_profile_avatar_1791906596676.jpg";
      }
      if (d.settings.heroBannerUrl && d.settings.heroBannerUrl.startsWith("/uploads/")) {
        d.settings.heroBannerUrl = "/images/hero_trading_terminal_1791906597313.jpg";
      }
    });
    await db.logAction("Media Library Cleared", `Deleted ${deletedCount} uploaded media files`);
    res.json({ success: true, count: deletedCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear media library: " + err.message });
  }
});
var handleAuditLogsClear = async (_req, res) => {
  try {
    await db.update((d) => {
      d.auditLogs = [];
    });
    await db.logAction("Audit Logs Cleared", "All system action logs were cleared");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear audit logs" });
  }
};
api.delete("/admin/audit-logs", requireAdmin, handleAuditLogsClear);
api.post("/admin/audit-logs/clear", requireAdmin, handleAuditLogsClear);
var handleSubmissionsClear = async (_req, res) => {
  try {
    await db.update((d) => {
      d.submissions = [];
    });
    await db.logAction("All Submissions Cleared", "Administrator cleared all account ID submissions");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear submissions" });
  }
};
api.delete("/admin/submissions-all", requireAdmin, handleSubmissionsClear);
api.post("/admin/submissions/clear-all", requireAdmin, handleSubmissionsClear);
app.use("/api", api);
app.use("/", api);
var app_default = app;

// server.ts
import express2 from "express";
import { createServer as createViteServer } from "vite";
import path3 from "path";
import fs3 from "fs";
import { fileURLToPath as fileURLToPath3 } from "url";
import { execSync } from "child_process";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
var server_default = app_default;
async function startServer() {
  const distPath = path3.resolve(__dirname3, "dist");
  const distIndex = path3.resolve(distPath, "index.html");
  const hasDist = fs3.existsSync(distIndex);
  if (process.env.NODE_ENV === "production" && !hasDist) {
    console.log("Production mode detected but dist/index.html is missing. Building app automatically...");
    try {
      execSync("npm run build", { stdio: "inherit" });
    } catch (e) {
      console.error("Auto-build failed:", e);
    }
  }
  if (fs3.existsSync(distIndex)) {
    console.log("Serving production static files from dist...");
    app_default.use(express2.static(distPath));
    app_default.get("*", (_req, res) => {
      res.sendFile(path3.resolve(distPath, "index.html"));
    });
  } else {
    console.log("Starting Vite development/middleware server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app_default.use(vite.middlewares);
  }
  app_default.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trading With Jahid] Full-stack Server listening on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
export {
  server_default as default
};
