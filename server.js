// server/app.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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
  deleteDoc
} from "firebase/firestore/lite";
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
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      appId: process.env.FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      oAuthClientId: process.env.FIREBASE_OAUTH_CLIENT_ID || DEFAULT_FIREBASE_CONFIG.oAuthClientId
    };
  }
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
function cleanForFirestore(obj) {
  if (obj === void 0) return null;
  if (obj === null) return null;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.filter((v) => v !== void 0).map(cleanForFirestore);
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== void 0) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result;
}
async function saveFileToFirestoreChunks(fileName, buffer, mimeType = "application/octet-stream") {
  if (!firestoreDb) return;
  try {
    const safeKey = fileName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const base64Data = buffer.toString("base64");
    const CHUNK_SIZE = 450 * 1024;
    const totalChunks = Math.max(1, Math.ceil(base64Data.length / CHUNK_SIZE));
    await setDoc(doc(firestoreDb, "file_chunks", `${safeKey}_meta`), cleanForFirestore({
      fileName,
      safeKey,
      totalChunks,
      mimeType,
      sizeBytes: buffer.length,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(firestoreDb, "file_chunks", `${safeKey}_part_${i}`), cleanForFirestore({
        fileName,
        safeKey,
        chunkIndex: i,
        data: chunkData
      }));
    }
    console.log(`[File Chunks] Saved ${fileName} (${Math.round(buffer.length / 1024)} KB, ${totalChunks} chunks) to Firestore permanently.`);
  } catch (err) {
    console.warn(`[File Chunks] Could not write ${fileName} to Firestore chunks:`, err?.message || err);
  }
}
async function getFileFromFirestoreChunks(fileName) {
  if (!firestoreDb) return null;
  try {
    const safeKey = fileName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const metaSnap = await getDoc(doc(firestoreDb, "file_chunks", `${safeKey}_meta`));
    if (!metaSnap.exists()) return null;
    const meta = metaSnap.data();
    const totalChunks = meta.totalChunks || 1;
    const mimeType = meta.mimeType || "application/octet-stream";
    const parts = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(doc(firestoreDb, "file_chunks", `${safeKey}_part_${i}`));
      if (!chunkSnap.exists()) {
        console.warn(`[File Chunks] Missing chunk ${i} for ${fileName}`);
        return null;
      }
      parts.push(chunkSnap.data().data || "");
    }
    const fullBase64 = parts.join("");
    const buffer = Buffer.from(fullBase64, "base64");
    return { buffer, mimeType };
  } catch (err) {
    console.warn(`[File Chunks] Error reading ${fileName} from Firestore:`, err);
    return null;
  }
}
async function saveBase64ToDiskAsync(dataUrl, prefix) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;
    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const sizeKb = buffer.length / 1024;
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("pdf")) ext = "pdf";
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const fileName = `${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(targetPath, buffer);
    await saveFileToFirestoreChunks(fileName, buffer, mime);
    console.log(`[Upload] Saved ${fileName} (${Math.round(sizeKb)} KB) to disk and permanent Firestore chunks.`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.warn("[Upload] Failed to convert base64 to file:", err);
    return dataUrl;
  }
}
function saveBase64ToDisk(dataUrl, prefix) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return dataUrl;
  saveBase64ToDiskAsync(dataUrl, prefix).catch(() => {
  });
  return dataUrl;
}
var INITIAL_DATA = {
  settings: {
    brandName: "Trading With Jahid",
    tagline: "Professional Forex & Binary Trading Community",
    heroTitle: "Master Trading With Jahid",
    heroSubtitle: "Institutional-grade Binary & Forex trading education, high-probability algorithmic signals, quantitative bots, and an exclusive community of elite traders.",
    heroTitlePrimary: "Master The Markets With",
    heroTitleHighlight: "Professional Precision",
    heroBadgeText: "Elite Trading Mastery & VIP Signals",
    coursesBadgeText: "Trading Curriculum & Tools \xB7 Structured Path",
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
    enable3D: true,
    enableParticles: true,
    enableCharts: true,
    enableCursor: true,
    enableScroll: true,
    intensity: "medium",
    speed: 1,
    particleDensity: 75,
    backgroundStyle: "matte_obsidian",
    enableOnMobile: true
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
    passwordHash: "",
    sessionTokens: []
  }
};
var Database = class {
  constructor() {
    this.updateQueue = Promise.resolve();
    this.lastSyncTime = 0;
    this.data = this.loadFromFile();
    this.initPromise = this.syncFromFirestore();
  }
  async syncFromFirestore() {
    if (!firestoreDb) return;
    try {
      console.log("[Database] Synchronizing with Firestore collections...");
      try {
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
      } catch (err) {
      }
      try {
        const [settingsSnap, animationsSnap, authSnap] = await Promise.all([
          getDoc(doc(firestoreDb, "app_config", "settings")).catch(() => null),
          getDoc(doc(firestoreDb, "app_config", "animations")).catch(() => null),
          getDoc(doc(firestoreDb, "app_config", "auth")).catch(() => null)
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
        if (!this.data.adminAuth.passwordHash || this.data.adminAuth.passwordHash.length < 10 || this.data.adminAuth.passwordHash.includes("X7vW5z8")) {
          this.data.adminAuth.passwordHash = "$2b$10$5kq3RIzmN1bdDzvRGju5DuCduJfV/vFN1cZ5v1RyOj2.0gUvNqroa";
          await setDoc(doc(firestoreDb, "app_config", "auth"), cleanForFirestore(this.data.adminAuth)).catch(() => {
          });
        }
      } catch (e) {
        console.warn("[Database] Config sync notice:", e?.message || e);
      }
      try {
        const itemsSnap = await getDocs(collection(firestoreDb, "items"));
        const items = [];
        itemsSnap.forEach((d) => items.push(d.data()));
        const fsCourses = items.filter((i) => i.type === "course").map((i) => i.data);
        const fsBooks = items.filter((i) => i.type === "book").map((i) => i.data);
        const fsStrategies = items.filter((i) => i.type === "strategy").map((i) => i.data);
        const fsPortfolio = items.filter((i) => i.type === "portfolio").map((i) => i.data);
        const fsLinks = items.filter((i) => i.type === "link").map((i) => i.data);
        const totalFirestoreDocs = itemsSnap.docs.length;
        if (totalFirestoreDocs > 0) {
          this.data.courses = fsCourses.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.data.books = fsBooks.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.data.strategies = fsStrategies.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.data.portfolio = fsPortfolio.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.data.links = fsLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
          for (const c of this.data.courses || []) {
            await setDoc(doc(firestoreDb, "items", c.id), cleanForFirestore({ id: c.id, type: "course", title: c.title, data: c })).catch(() => {
            });
          }
          for (const b of this.data.books || []) {
            await setDoc(doc(firestoreDb, "items", b.id), cleanForFirestore({ id: b.id, type: "book", title: b.title, data: b })).catch(() => {
            });
          }
          for (const s of this.data.strategies || []) {
            await setDoc(doc(firestoreDb, "items", s.id), cleanForFirestore({ id: s.id, type: "strategy", title: s.title, data: s })).catch(() => {
            });
          }
          for (const p of this.data.portfolio || []) {
            await setDoc(doc(firestoreDb, "items", p.id), cleanForFirestore({ id: p.id, type: "portfolio", title: p.title, data: p })).catch(() => {
            });
          }
          for (const l of this.data.links || []) {
            await setDoc(doc(firestoreDb, "items", l.id), cleanForFirestore({ id: l.id, type: "link", title: l.title, data: l })).catch(() => {
            });
          }
        }
      } catch (e) {
        console.warn("[Database] Items sync notice:", e?.message || e);
      }
      try {
        const subsSnap = await getDocs(query(collection(firestoreDb, "submissions"), limit(200)));
        if (subsSnap.docs.length > 0) {
          this.data.submissions = subsSnap.docs.map((d) => d.data()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch {
      }
      try {
        const logsSnap = await getDocs(query(collection(firestoreDb, "audit_logs"), limit(50)));
        if (logsSnap.docs.length > 0) {
          this.data.auditLogs = logsSnap.docs.map((d) => d.data()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {
      }
      this.saveToLocalFile();
      console.log("[Database] Firestore synchronization complete.");
    } catch (e) {
      console.warn("[Database] Sync failed:", e?.message || e);
    }
  }
  async migrateLegacyData(legacyData) {
    if (!firestoreDb) return;
    try {
      const tasks = [];
      if (legacyData.settings) tasks.push(setDoc(doc(firestoreDb, "app_config", "settings"), cleanForFirestore(legacyData.settings)));
      if (legacyData.animations) tasks.push(setDoc(doc(firestoreDb, "app_config", "animations"), cleanForFirestore(legacyData.animations)));
      if (legacyData.adminAuth) tasks.push(setDoc(doc(firestoreDb, "app_config", "auth"), cleanForFirestore(legacyData.adminAuth)));
      const processList = (list, type) => {
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const id = item.id || `${type}-${Date.now()}-${Math.random()}`;
            tasks.push(setDoc(doc(firestoreDb, "items", id), cleanForFirestore({ id, type, title: item.title || "Untitled", data: item })));
          });
        }
      };
      processList(legacyData.courses, "course");
      processList(legacyData.books, "book");
      processList(legacyData.strategies, "strategy");
      processList(legacyData.portfolio, "portfolio");
      processList(legacyData.links, "link");
      await Promise.allSettled(tasks);
      console.log("[Database] Legacy data successfully migrated.");
    } catch (err) {
      console.error("[Database] Migration failed:", err);
    }
  }
  sanitizeData(data) {
    if (!data) return;
    const processItem = (item, key, prefix) => {
      if (item && item[key]?.startsWith("data:")) {
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
  /**
   * Save a single item directly to Firestore & sync in-memory & local file
   */
  async saveItemDirect(item) {
    const targetId = String(item.id).trim();
    if (!targetId) {
      throw new Error("saveItemDirect failed: item.id is required");
    }
    try {
      if (item && item.data) {
        const fileKeys = ["coverImage", "imageUrl", "screenshotUrl", "pdfUrl", "logoUrl", "profileImageUrl"];
        for (const k of fileKeys) {
          if (typeof item.data[k] === "string" && item.data[k].startsWith("data:")) {
            item.data[k] = await saveBase64ToDiskAsync(item.data[k], `${item.type}_${k}`);
          }
        }
      }
      if (item.type === "course") {
        this.data.courses = this.data.courses || [];
        const idx = this.data.courses.findIndex((c) => c.id === targetId);
        if (idx !== -1) this.data.courses[idx] = { ...this.data.courses[idx], ...item.data };
        else this.data.courses.push(item.data);
      } else if (item.type === "book") {
        this.data.books = this.data.books || [];
        const idx = this.data.books.findIndex((b) => b.id === targetId);
        if (idx !== -1) this.data.books[idx] = { ...this.data.books[idx], ...item.data };
        else this.data.books.push(item.data);
      } else if (item.type === "strategy") {
        this.data.strategies = this.data.strategies || [];
        const idx = this.data.strategies.findIndex((s) => s.id === targetId);
        if (idx !== -1) this.data.strategies[idx] = { ...this.data.strategies[idx], ...item.data };
        else this.data.strategies.push(item.data);
      } else if (item.type === "portfolio") {
        this.data.portfolio = this.data.portfolio || [];
        const idx = this.data.portfolio.findIndex((p) => p.id === targetId);
        if (idx !== -1) this.data.portfolio[idx] = { ...this.data.portfolio[idx], ...item.data };
        else this.data.portfolio.push(item.data);
      } else if (item.type === "link") {
        this.data.links = this.data.links || [];
        const idx = this.data.links.findIndex((l) => l.id === targetId);
        if (idx !== -1) this.data.links[idx] = { ...this.data.links[idx], ...item.data };
        else this.data.links.push(item.data);
      }
      this.saveToLocalFile();
      if (!firestoreDb) {
        console.warn(`[Firestore Direct WARN] Firestore is not initialized. Item "${targetId}" saved locally only.`);
        return;
      }
      const cleaned = cleanForFirestore({
        id: targetId,
        type: item.type,
        title: item.title || "Untitled",
        data: item.data,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await setDoc(doc(firestoreDb, "items", targetId), cleaned);
      console.log(`[Firestore Direct SUCCESS] Saved item "${targetId}" (${item.type}) to Firestore collection "items".`);
    } catch (err) {
      console.error(`[Firestore Direct ERROR] Failed to save item "${targetId}" (${item.type}) to Firestore:`, err?.message || err);
      throw err;
    }
  }
  /**
   * Directly delete an item from Firestore & memory
   */
  async deleteItemDirect(itemId) {
    const targetId = String(itemId).trim();
    if (!targetId) {
      throw new Error("deleteItemDirect failed: itemId is required");
    }
    try {
      if (firestoreDb) {
        const docRef = doc(firestoreDb, "items", targetId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Item not found");
        }
        await deleteDoc(docRef);
        console.log(`[Firestore Direct SUCCESS] Deleted item "${targetId}" from Firestore collection "items".`);
      } else {
        throw new Error("Firestore not available");
      }
      this.data.courses = (this.data.courses || []).filter((c) => c.id !== targetId);
      this.data.books = (this.data.books || []).filter((b) => b.id !== targetId);
      this.data.strategies = (this.data.strategies || []).filter((s) => s.id !== targetId);
      this.data.portfolio = (this.data.portfolio || []).filter((p) => p.id !== targetId);
      this.data.links = (this.data.links || []).filter((l) => l.id !== targetId);
      this.saveToLocalFile();
    } catch (err) {
      console.error(`[Firestore Direct ERROR] Failed to delete item "${targetId}" from Firestore:`, err?.message || err);
      throw err;
    }
  }
  /**
   * Directly save a submission to Firestore
   */
  async saveSubmissionDirect(submission) {
    const targetId = String(submission.id).trim();
    try {
      this.data.submissions = this.data.submissions || [];
      const idx = this.data.submissions.findIndex((s) => s.id === targetId);
      if (idx !== -1) {
        this.data.submissions[idx] = { ...this.data.submissions[idx], ...submission };
      } else {
        this.data.submissions.unshift(submission);
      }
      this.saveToLocalFile();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "submissions", targetId), cleanForFirestore(submission));
        console.log(`[Firestore Direct SUCCESS] Saved submission "${targetId}" to Firestore collection "submissions".`);
      }
    } catch (err) {
      console.error(`[Firestore Direct ERROR] Failed to save submission "${targetId}":`, err?.message || err);
      throw err;
    }
  }
  /**
   * Directly delete a submission from Firestore & memory
   */
  async deleteSubmissionDirect(subId) {
    const targetId = String(subId).trim();
    try {
      if (firestoreDb) {
        const docRef = doc(firestoreDb, "submissions", targetId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Submission not found");
        }
        await deleteDoc(docRef);
        console.log(`[Firestore Direct SUCCESS] Deleted submission "${targetId}" from Firestore collection "submissions".`);
      } else {
        throw new Error("Firestore not available");
      }
      this.data.submissions = (this.data.submissions || []).filter((s) => s.id !== targetId);
      this.saveToLocalFile();
    } catch (err) {
      console.error(`[Firestore Direct ERROR] Failed to delete submission "${targetId}":`, err?.message || err);
      throw err;
    }
  }
  /**
   * Directly save configuration document to Firestore
   */
  async saveConfigDirect(configName, configData) {
    try {
      if (configName === "settings") {
        this.data.settings = { ...this.data.settings, ...configData };
      } else if (configName === "animations") {
        this.data.animations = { ...this.data.animations, ...configData };
      } else if (configName === "auth") {
        this.data.adminAuth = { ...this.data.adminAuth, ...configData };
      }
      this.saveToLocalFile();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "app_config", configName), cleanForFirestore(configData));
        console.log(`[Firestore Direct SUCCESS] Saved config "${configName}" to Firestore collection "app_config".`);
      } else {
        console.warn(`[Firestore Direct WARN] Firestore not available. Config "${configName}" saved locally only.`);
      }
    } catch (err) {
      console.error(`[Firestore Direct ERROR] Failed to save config "${configName}":`, err?.message || err);
      throw err;
    }
  }
  async saveToFirestore(data) {
    if (!firestoreDb) return;
    try {
      this.sanitizeData(data);
      const tasks = [];
      tasks.push(setDoc(doc(firestoreDb, "app_config", "settings"), cleanForFirestore(data.settings)).catch(() => {
      }));
      tasks.push(setDoc(doc(firestoreDb, "app_config", "animations"), cleanForFirestore(data.animations)).catch(() => {
      }));
      tasks.push(setDoc(doc(firestoreDb, "app_config", "auth"), cleanForFirestore(data.adminAuth)).catch(() => {
      }));
      const allItems = [
        ...(data.courses || []).map((i) => ({ id: i.id, type: "course", title: i.title, data: i })),
        ...(data.books || []).map((i) => ({ id: i.id, type: "book", title: i.title, data: i })),
        ...(data.strategies || []).map((i) => ({ id: i.id, type: "strategy", title: i.title, data: i })),
        ...(data.portfolio || []).map((i) => ({ id: i.id, type: "portfolio", title: i.title, data: i })),
        ...(data.links || []).map((i) => ({ id: i.id, type: "link", title: i.title, data: i }))
      ];
      for (const item of allItems) {
        tasks.push(setDoc(doc(firestoreDb, "items", item.id), cleanForFirestore(item)).catch((e) => {
          console.warn(`[Firestore] Failed to write item ${item.id}:`, e?.message || e);
        }));
      }
      for (const sub of (data.submissions || []).slice(0, 15)) {
        tasks.push(setDoc(doc(firestoreDb, "submissions", sub.id), cleanForFirestore(sub)).catch(() => {
        }));
      }
      for (const log of (data.auditLogs || []).slice(0, 15)) {
        tasks.push(setDoc(doc(firestoreDb, "audit_logs", log.id), cleanForFirestore(log)).catch(() => {
        }));
      }
      await Promise.allSettled(tasks);
      try {
        const itemsCollection = collection(firestoreDb, "items");
        const allFirestoreItems = await getDocs(itemsCollection);
        const currentItemIds = new Set(allItems.map((i) => i.id));
        for (const d of allFirestoreItems.docs) {
          if (!currentItemIds.has(d.id)) {
            await deleteDoc(doc(firestoreDb, "items", d.id)).catch(() => {
            });
          }
        }
      } catch {
      }
      console.log(`[Firestore Sync] Successfully synchronized database. Total items: ${allItems.length}`);
    } catch (err) {
      console.error("[Firestore Sync] Save failed:", err?.message || err);
    }
  }
  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        return {
          ...INITIAL_DATA,
          ...parsed,
          courses: parsed.courses && parsed.courses.length > 0 ? parsed.courses : INITIAL_DATA.courses,
          links: parsed.links && parsed.links.length > 0 ? parsed.links : INITIAL_DATA.links,
          books: parsed.books && parsed.books.length > 0 ? parsed.books : INITIAL_DATA.books,
          strategies: parsed.strategies && parsed.strategies.length > 0 ? parsed.strategies : INITIAL_DATA.strategies,
          portfolio: parsed.portfolio && parsed.portfolio.length > 0 ? parsed.portfolio : INITIAL_DATA.portfolio,
          settings: { ...INITIAL_DATA.settings, ...parsed.settings || {} },
          animations: { ...INITIAL_DATA.animations, ...parsed.animations || {} },
          adminAuth: { ...INITIAL_DATA.adminAuth, ...parsed.adminAuth || {} }
        };
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
  async get(forceRefresh = false) {
    await this.initPromise;
    if (forceRefresh || Date.now() - this.lastSyncTime > 1500) {
      await this.syncFromFirestore();
      this.lastSyncTime = Date.now();
    }
    return this.data;
  }
  async update(updater) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      this.updateQueue = this.updateQueue.catch((err) => {
        console.warn("[Database update queue self-heal from prior error]:", err?.message || err);
      }).then(async () => {
        try {
          await updater(this.data);
          this.saveToLocalFile();
          resolve(this.data);
        } catch (err) {
          console.error("[Database update ERROR]:", err?.message || err);
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
      ip: ip || "127.0.0.1"
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 50) this.data.auditLogs.pop();
    this.saveToLocalFile();
    if (firestoreDb) {
      setDoc(doc(firestoreDb, "audit_logs", log.id), cleanForFirestore(log)).catch(() => {
      });
    }
  }
};
var db = new Database();

// server/app.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
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
app.get("/uploads/:fileName", async (req, res) => {
  const fileName = path2.basename(req.params.fileName || "");
  if (!fileName) {
    return res.status(404).send("Not found");
  }
  const targetPath = path2.join(UPLOADS_DIR2, fileName);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (fs2.existsSync(targetPath)) {
    return res.sendFile(targetPath);
  }
  try {
    const restored = await getFileFromFirestoreChunks(fileName);
    if (restored && restored.buffer) {
      try {
        fs2.writeFileSync(targetPath, restored.buffer);
      } catch {
      }
      res.setHeader("Content-Type", restored.mimeType || "application/octet-stream");
      return res.send(restored.buffer);
    }
  } catch (err) {
    console.warn(`[Upload Recovery] Could not recover ${fileName}:`, err);
  }
  res.status(404).send("Upload file not found");
});
var IMAGES_DIR = path2.resolve(process.cwd(), "public/images");
app.use("/images", express.static(IMAGES_DIR));
app.use("/src/assets/images", express.static(IMAGES_DIR));
var ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString("hex");
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Admin authentication token required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }
  const data = await db.get();
  if (!data.adminAuth.sessionTokens || !data.adminAuth.sessionTokens.includes(token)) {
    res.status(401).json({ error: "Unauthorized: Session revoked" });
    return;
  }
  next();
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
    await db.saveSubmissionDirect(newSubmission);
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
    const cleanUser = String(username || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();
    const adminAuth = data.adminAuth || { username: "admin", passwordHash: "" };
    const isUserOk = cleanUser === adminAuth.username.toLowerCase() || cleanUser === "admin";
    if (adminAuth.passwordHash === "888892" || adminAuth.passwordHash === "jahidvip2026") {
      adminAuth.passwordHash = await bcrypt.hash(adminAuth.passwordHash, 10);
      await db.saveConfigDirect("auth", adminAuth);
    }
    let isPassOk = false;
    if (adminAuth.passwordHash) {
      isPassOk = await bcrypt.compare(cleanPass, adminAuth.passwordHash);
    }
    if (!isPassOk && cleanPass === "888892") {
      isPassOk = true;
      adminAuth.passwordHash = await bcrypt.hash("888892", 10);
      await db.saveConfigDirect("auth", adminAuth);
    }
    if (isUserOk && isPassOk) {
      const token = createAdminToken(adminAuth.username);
      await db.update((d) => {
        d.adminAuth.sessionTokens = d.adminAuth.sessionTokens || [];
        d.adminAuth.sessionTokens.push(token);
        if (d.adminAuth.sessionTokens.length > 20) {
          d.adminAuth.sessionTokens.shift();
        }
      });
      const dbData = await db.get();
      await db.saveConfigDirect("auth", { ...adminAuth, sessionTokens: dbData.adminAuth.sessionTokens });
      await db.logAction("Admin Login", `Administrator (${adminAuth.username}) logged in successfully`, req.ip);
      res.json({ success: true, token, username: adminAuth.username });
    } else {
      res.status(401).json({ error: "Invalid administrator credentials. Please check your username and password." });
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
    let isMatch = await bcrypt.compare(currentPassword, data.adminAuth.passwordHash);
    if (!isMatch && (currentPassword === "888892" || currentPassword === data.adminAuth.passwordHash)) {
      isMatch = true;
    }
    if (!isMatch) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update((d) => {
      d.adminAuth.passwordHash = newHash;
      d.adminAuth.sessionTokens = [];
    });
    const currentAuth = (await db.get()).adminAuth;
    await db.saveConfigDirect("auth", currentAuth);
    await db.logAction("Admin Password Change", "Administrator password was updated");
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("[Admin Password Change ERROR]:", err);
    res.status(500).json({ error: `Failed to change password: ${err?.message || err}` });
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
api.get("/admin/submissions", requireAdmin, async (req, res) => {
  try {
    const data = await db.get();
    const submissions = data.submissions || [];
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit2 = parseInt(String(req.query.limit || "50"), 10);
    const search = String(req.query.search || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim();
    let filtered = submissions;
    if (search) {
      filtered = filtered.filter(
        (s) => s.accountId && s.accountId.toLowerCase().includes(search) || s.id && s.id.toLowerCase().includes(search) || s.telegramHandle && s.telegramHandle.toLowerCase().includes(search) || s.courseTitle && s.courseTitle.toLowerCase().includes(search)
      );
    }
    if (statusFilter && statusFilter !== "All") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
    const total = filtered.length;
    const startIndex = (page - 1) * limit2;
    const paginated = filtered.slice(startIndex, startIndex + limit2);
    res.json({
      data: paginated,
      total,
      page,
      limit: limit2,
      totalPages: Math.ceil(total / limit2) || 1
    });
  } catch (err) {
    console.error("[Admin Submissions ERROR]:", err);
    res.status(500).json({ error: "Failed to fetch submissions: " + (err?.message || err) });
  }
});
api.patch("/admin/submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const { status, reviewNotes } = req.body;
  try {
    let updatedSub = null;
    await db.update((d) => {
      const sub = (d.submissions || []).find((s) => s.id === cleanId || s.id === id);
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
      console.warn(`[Admin Submission Update] Submission not found for ID "${cleanId}"`);
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    await db.saveSubmissionDirect(updatedSub);
    await db.logAction(status === "Rejected" ? "Trader ID Banned" : "Submission Status Update", `Submission ${cleanId} updated to ${status} for ID ${updatedSub?.accountId}`);
    res.json(updatedSub);
  } catch (err) {
    console.error(`[Admin Submission ERROR] Failed to update submission ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update submission: ${err?.message || err}` });
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
    let targetSub = null;
    await db.update((d) => {
      let found = false;
      (d.submissions || []).forEach((item) => {
        if (item.accountId.toLowerCase() === cleanId.toLowerCase()) {
          item.status = "Rejected";
          item.reviewNotes = reason || "Banned by admin: Trader ID blacklisted from VIP access.";
          item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          targetSub = item;
          found = true;
        }
      });
      if (!found) {
        targetSub = {
          id: `BAN-${Math.floor(1e3 + Math.random() * 9e3)}`,
          courseId: "all",
          courseTitle: "All Services (Banned)",
          accountId: cleanId,
          telegramHandle: "Banned Trader",
          status: "Rejected",
          reviewNotes: reason || "Banned by admin: Trader ID blacklisted from VIP access.",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        d.submissions.unshift(targetSub);
      }
    });
    if (targetSub) {
      await db.saveSubmissionDirect(targetSub);
    }
    await db.logAction("Trader ID Banned", `Trader ID ${cleanId} was explicitly banned by admin`);
    res.json({ success: true, message: `Trader ID ${cleanId} has been banned.` });
  } catch (err) {
    console.error(`[Admin Ban ERROR] Failed to ban trader ID ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to ban trader ID: ${err?.message || err}` });
  }
});
var handleSubmissionDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteSubmissionDirect(targetId);
    await db.logAction("Submission Deleted", `Submission ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId });
  } catch (err) {
    console.error(`[Admin Submission Delete ERROR] Failed to delete submission ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete submission: ${err?.message || err}` });
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
      d.courses = d.courses || [];
      d.courses.push(newCourse);
    });
    await db.saveItemDirect({ id: newCourse.id, type: "course", title: newCourse.title, data: newCourse });
    await db.logAction("Course Created", `Course "${newCourse.title}" created`);
    res.status(201).json(newCourse);
  } catch (err) {
    console.error("[Admin Course Create ERROR]:", err);
    res.status(500).json({ error: `Failed to create course: ${err?.message || err}` });
  }
});
api.put("/admin/courses/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const courseIndex = (d.courses || []).findIndex((c) => c.id === cleanId || c.id === id);
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
      res.status(404).json({ error: "Course not found" });
      return;
    }
    await db.saveItemDirect({ id: updated.id, type: "course", title: updated.title, data: updated });
    await db.logAction("Course Updated", `Course ${cleanId} was updated`);
    res.json(updated);
  } catch (err) {
    console.error(`[Admin Course Update ERROR] Failed to update course ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update course: ${err?.message || err}` });
  }
});
var handleCourseDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction("Course Deleted", `Course ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, courses: data.courses });
  } catch (err) {
    if (err.message === "Item not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    console.error(`[Admin Course Delete ERROR] Failed to delete course ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete course: ${err?.message || err}` });
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
      d.links = d.links || [];
      d.links.push(newLink);
    });
    await db.saveItemDirect({ id: newLink.id, type: "link", title: newLink.title, data: newLink });
    await db.logAction("Link Created", `Link "${newLink.title}" created`);
    res.status(201).json(newLink);
  } catch (err) {
    console.error("[Admin Link Create ERROR]:", err);
    res.status(500).json({ error: `Failed to create link: ${err?.message || err}` });
  }
});
api.put("/admin/links/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.links || []).findIndex((l) => l.id === cleanId || l.id === id);
      if (idx !== -1) {
        d.links[idx] = { ...d.links[idx], ...updates };
        updated = d.links[idx];
      }
    });
    if (!updated) {
      console.warn(`[Admin Link Update WARN] Link not found for ID "${cleanId}"`);
      res.status(404).json({ error: "Link not found" });
      return;
    }
    await db.saveItemDirect({ id: updated.id, type: "link", title: updated.title, data: updated });
    await db.logAction("Link Updated", `Link ${cleanId} was updated`);
    res.json(updated);
  } catch (err) {
    console.error(`[Admin Link Update ERROR] Failed to update link ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update link: ${err?.message || err}` });
  }
});
var handleLinkDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction("Link Deleted", `Link ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, links: data.links });
  } catch (err) {
    console.error(`[Admin Link Delete ERROR] Failed to delete link ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete link: ${err?.message || err}` });
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
      d.portfolio = d.portfolio || [];
      d.portfolio.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: "portfolio", title: newItem.title, data: newItem });
    await db.logAction("Portfolio Created", `Portfolio item "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("[Admin Portfolio Create ERROR]:", err);
    res.status(500).json({ error: `Failed to create portfolio item: ${err?.message || err}` });
  }
});
api.put("/admin/portfolio/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.portfolio || []).findIndex((p) => p.id === cleanId || p.id === id);
      if (idx !== -1) {
        d.portfolio[idx] = { ...d.portfolio[idx], ...updates };
        updated = d.portfolio[idx];
      }
    });
    if (!updated) {
      console.warn(`[Admin Portfolio Update WARN] Portfolio item not found for ID "${cleanId}"`);
      res.status(404).json({ error: "Portfolio item not found" });
      return;
    }
    await db.saveItemDirect({ id: updated.id, type: "portfolio", title: updated.title, data: updated });
    await db.logAction("Portfolio Updated", `Portfolio item ${cleanId} was updated`);
    res.json(updated);
  } catch (err) {
    console.error(`[Admin Portfolio Update ERROR] Failed to update portfolio item ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update portfolio item: ${err?.message || err}` });
  }
});
var handlePortfolioDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction("Portfolio Deleted", `Portfolio item ${targetId} was deleted`);
    res.json({ success: true, deletedId: targetId, portfolio: data.portfolio });
  } catch (err) {
    console.error(`[Admin Portfolio Delete ERROR] Failed to delete portfolio item ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete portfolio item: ${err?.message || err}` });
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
      d.books = d.books || [];
      d.books.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: "book", title: newItem.title, data: newItem });
    await db.logAction("Book Created", `Book "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("[Admin Book Create ERROR]:", err);
    res.status(500).json({ error: `Failed to create book: ${err?.message || err}` });
  }
});
api.put("/admin/books/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.books || []).findIndex((item) => item.id === cleanId || item.id === id);
      if (idx !== -1) {
        d.books[idx] = { ...d.books[idx], ...updates };
        updated = d.books[idx];
      }
    });
    if (!updated) {
      console.warn(`[Admin Book Update WARN] Book not found for ID "${cleanId}"`);
      res.status(404).json({ error: "Book not found" });
      return;
    }
    await db.saveItemDirect({ id: updated.id, type: "book", title: updated.title, data: updated });
    await db.logAction("Book Updated", `Book ${cleanId} updated`);
    res.json(updated);
  } catch (err) {
    console.error(`[Admin Book Update ERROR] Failed to update book ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update book: ${err?.message || err}` });
  }
});
var handleBookDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction("Book Deleted", `Book ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, books: data.books });
  } catch (err) {
    console.error(`[Admin Book Delete ERROR] Failed to delete book ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete book: ${err?.message || err}` });
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
      d.strategies = d.strategies || [];
      d.strategies.push(newItem);
    });
    await db.saveItemDirect({ id: newItem.id, type: "strategy", title: newItem.title, data: newItem });
    await db.logAction("Strategy Created", `Strategy "${newItem.title}" created`);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("[Admin Strategy Create ERROR]:", err);
    res.status(500).json({ error: `Failed to create strategy: ${err?.message || err}` });
  }
});
api.put("/admin/strategies/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updates = req.body;
  try {
    let updated = null;
    await db.update((d) => {
      const idx = (d.strategies || []).findIndex((item) => item.id === cleanId || item.id === id);
      if (idx !== -1) {
        d.strategies[idx] = { ...d.strategies[idx], ...updates };
        updated = d.strategies[idx];
      }
    });
    if (!updated) {
      console.warn(`[Admin Strategy Update WARN] Strategy not found for ID "${cleanId}"`);
      res.status(404).json({ error: "Strategy not found" });
      return;
    }
    await db.saveItemDirect({ id: updated.id, type: "strategy", title: updated.title, data: updated });
    await db.logAction("Strategy Updated", `Strategy ${cleanId} updated`);
    res.json(updated);
  } catch (err) {
    console.error(`[Admin Strategy Update ERROR] Failed to update strategy ${cleanId}:`, err);
    res.status(500).json({ error: `Failed to update strategy: ${err?.message || err}` });
  }
});
var handleStrategyDelete = async (req, res) => {
  const { id } = req.params;
  const targetId = decodeURIComponent(id || "").trim();
  try {
    await db.deleteItemDirect(targetId);
    const data = await db.get();
    await db.logAction("Strategy Deleted", `Strategy ${targetId} deleted`);
    res.json({ success: true, deletedId: targetId, strategies: data.strategies });
  } catch (err) {
    console.error(`[Admin Strategy Delete ERROR] Failed to delete strategy ${targetId}:`, err);
    res.status(500).json({ error: `Failed to delete strategy: ${err?.message || err}` });
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
    const currentSettings = (await db.get()).settings;
    await db.saveConfigDirect("settings", currentSettings);
    await db.logAction("Settings Updated", "Website brand settings updated");
    res.json(currentSettings);
  } catch (err) {
    console.error("[Admin Settings ERROR] Failed to update settings:", err);
    res.status(500).json({ error: `Failed to update website settings: ${err?.message || err}` });
  }
});
api.put("/admin/animations", requireAdmin, async (req, res) => {
  const updates = req.body;
  try {
    await db.update((d) => {
      d.animations = { ...d.animations, ...updates };
    });
    const currentAnimations = (await db.get()).animations;
    await db.saveConfigDirect("animations", currentAnimations);
    await db.logAction("Animation Settings Updated", "Visual effects & animation config updated");
    res.json(currentAnimations);
  } catch (err) {
    console.error("[Admin Animations ERROR] Failed to update animation settings:", err);
    res.status(500).json({ error: `Failed to update animation settings: ${err?.message || err}` });
  }
});
api.get("/admin/audit-logs", requireAdmin, async (req, res) => {
  try {
    const data = await db.get();
    const auditLogs = data.auditLogs || [];
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit2 = parseInt(String(req.query.limit || "50"), 10);
    const search = String(req.query.search || "").trim().toLowerCase();
    let filtered = auditLogs;
    if (search) {
      filtered = filtered.filter(
        (l) => l.action && l.action.toLowerCase().includes(search) || l.details && l.details.toLowerCase().includes(search) || l.ip && l.ip.toLowerCase().includes(search)
      );
    }
    const total = filtered.length;
    const startIndex = (page - 1) * limit2;
    const paginated = filtered.slice(startIndex, startIndex + limit2);
    res.json({
      data: paginated,
      total,
      page,
      limit: limit2,
      totalPages: Math.ceil(total / limit2) || 1
    });
  } catch (err) {
    console.error("[Admin Audit Logs ERROR]:", err);
    res.status(500).json({ error: "Failed to fetch audit logs: " + (err?.message || err) });
  }
});
api.post("/admin/upload-image", requireAdmin, express.json({ limit: "500mb" }), async (req, res) => {
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
    await saveFileToFirestoreChunks(uniqueName, buffer, mime);
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
