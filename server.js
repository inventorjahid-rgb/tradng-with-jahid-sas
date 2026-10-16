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
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var LOCAL_DATA_PATH = path.resolve(process.cwd(), "data/db.json");
var TMP_DATA_PATH = path.resolve("/tmp", "trading_jahid_db.json");
function getDbFilePath() {
  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, ".test"), "test");
    fs.unlinkSync(path.join(dir, ".test"));
    return LOCAL_DATA_PATH;
  } catch {
    try {
      if (!fs.existsSync("/tmp")) {
        fs.mkdirSync("/tmp", { recursive: true });
      }
      return TMP_DATA_PATH;
    } catch {
      return LOCAL_DATA_PATH;
    }
  }
}
var DATA_FILE_PATH = getDbFilePath();
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
    coursesSubtitle: "Eliminate guesswork with institutional methodologies. Select a course or service below to review the curriculum and initiate verified access.",
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
    aboutBio: "Professional financial trader, market technician, and trading mentor with over 7 years of specialized expertise in high-frequency Binary price action, institutional Forex order flow, and quantitative algorithmic strategies. My mission is to guide disciplined traders toward real consistency without gambling or false promises.",
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
    riskNotice: "High Risk Warning: Trading Forex, Binary Options, and derivative financial contracts carries a high level of risk to your capital. You should never trade with funds you cannot afford to lose. Past performance of any system or mentor is not indicative of future results."
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
  courses: [
    {
      id: "course-binary",
      slug: "binary",
      title: "Binary Trading Mastery",
      category: "Binary Trading Course",
      shortDesc: "Master 1-minute to 5-minute candlestick momentum, rejection zones, and volume spread analysis.",
      fullDesc: "A complete masterclass in high-frequency binary options trading. Learn price action patterns, Bollinger squeeze breakouts, false breakout filters, and strict martingale/compounding math.",
      coverImage: "/images/binary_course_cover_1791906598444.jpg",
      accessMode: "new_account",
      registrationUrl: "https://pocketoption.com/register?utm_source=jahid_vip",
      joinUrl: "https://t.me/+JahidBinaryVipPortal",
      modules: [
        "Candlestick Anatomy, Wick Rejections & Key S/R Zones",
        "Volume Spread Analysis (VSA) for 60-Second Expirations",
        "Dynamic Indicator Confluence: Bollinger Bands & RSI 14/7",
        "Mathematical Money Management: Compound vs Fixed Risk",
        "Eliminating Emotional Trading & Over-trading Traps"
      ],
      requirements: "Register a fresh account via our partner link and submit your Broker Account ID for activation.",
      faqs: [
        { question: "Is this suitable for beginners?", answer: "Yes, we teach from foundational candlestick reading up to institutional setups." },
        { question: "Which brokers are supported?", answer: "Pocket Option, Quotex, and Deriv are fully supported." }
      ],
      published: true,
      featured: true,
      order: 1,
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "course-forex",
      slug: "forex",
      title: "Smart Money Forex Dynamics",
      category: "Forex Institutional",
      shortDesc: "Trade institutional order blocks, mitigation blocks, and liquidity sweeps with 1:5 risk-reward precision.",
      fullDesc: "Comprehensive institutional Forex mentorship. Discover how market makers engineer liquidity, how to spot high-timeframe order blocks, and how to execute swing and intraday trades with extreme accuracy.",
      coverImage: "/images/forex_course_cover_1791906599347.jpg",
      accessMode: "existing_id",
      registrationUrl: "https://exness.com/register?utm_source=jahid_vip",
      joinUrl: "https://t.me/+JahidForexSMC",
      modules: [
        "Institutional Market Structure & Change of Character (CHoCH)",
        "Liquidity Engineering: Inducement, Equal Highs & Stop Hunts",
        "Order Block & Fair Value Gap (FVG) Refinement",
        "Multi-Timeframe Top-Down Analysis Protocol",
        "Risk-to-Reward Scaling & Execution Discipline"
      ],
      requirements: "Use our partner IB link or link your existing trading account ID for verification.",
      faqs: [
        { question: "Do I need a large starting balance?", answer: "No, you can start with a micro account (cent account or $50 standard)." },
        { question: "Are live sessions included?", answer: "Yes, weekly London session live trading and chart reviews." }
      ],
      published: true,
      featured: true,
      order: 2,
      createdAt: "2026-01-12T10:00:00Z"
    },
    {
      id: "service-signals",
      slug: "signals",
      title: "VIP Trading Signals & Analysis",
      category: "Telegram VIP Signals",
      shortDesc: "Real-time high-probability Binary & Forex signal alerts with entry timing, stop loss, and TP targets.",
      fullDesc: "Get direct VIP Telegram broadcast alerts delivered right when setups form. Each signal includes thorough technical breakdown, risk level, and expiration/target parameters.",
      coverImage: "/images/hero_trading_terminal_1791906597313.jpg",
      accessMode: "existing_id",
      registrationUrl: "https://t.me/tradewithjahid",
      joinUrl: "https://t.me/+JahidVipSignalsChannel",
      modules: [
        "Daily London & New York Session Signal Broadcasts",
        "Pre-Market Chart Analysis & Key Level Mapping",
        "Live Trade Management & Partial Profit Updates",
        "Risk Management Guidelines per Signal Alert"
      ],
      requirements: "Submit your active trading broker account ID to receive instant VIP Telegram channel access.",
      faqs: [
        { question: "How many signals per day?", answer: "Typically 3 to 7 high-confluence signals across forex and binary." },
        { question: "How are alerts sent?", answer: "Instantly via our private VIP Telegram channel." }
      ],
      published: true,
      featured: true,
      order: 3,
      createdAt: "2026-01-15T10:00:00Z"
    },
    {
      id: "service-bot",
      slug: "bot",
      title: "Alpha Engine Algorithmic Bot",
      category: "Quantitative Bot",
      shortDesc: "Automated binary and synthetic index execution bot engineered for disciplined algorithmic compounding.",
      fullDesc: "Our proprietary Alpha Engine bot removes emotion entirely. Powered by trend-following momentum indicators and strict volatility filters.",
      coverImage: "/images/trading_bot_cover_1791906598974.jpg",
      accessMode: "new_account",
      registrationUrl: "https://deriv.com/signup?utm_source=jahid_vip",
      joinUrl: "https://t.me/+JahidBotAccess",
      modules: [
        "Bot Installation & Parameter Configuration",
        "Risk Guardrails: Max Drawdown & Daily Profit Lock",
        "Backtesting Results & Optimization Guidelines"
      ],
      requirements: "Register a partner trading account and submit your account ID for bot license key activation.",
      faqs: [
        { question: "Does the bot run 24/7?", answer: "It operates during high-liquidity London and New York sessions." }
      ],
      published: true,
      featured: false,
      order: 4,
      createdAt: "2026-01-18T10:00:00Z"
    }
  ],
  links: [
    {
      id: "link-1",
      title: "VIP Telegram Community",
      category: "Community",
      url: "https://t.me/tradewithjahid",
      description: "Join over 14,800 active traders sharing setups, daily analysis, and results.",
      iconName: "Send",
      buttonLabel: "Join Free Telegram",
      displayLocations: ["navbar", "hero", "social_section", "footer", "floating"],
      order: 1,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 1420,
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "link-2",
      title: "Pocket Option Partner Portal",
      category: "Broker",
      url: "https://pocketoption.com/register?utm_source=jahid_vip",
      description: "Register your trading account for Binary Mastery & VIP Access.",
      iconName: "ExternalLink",
      buttonLabel: "Open Account",
      displayLocations: ["course_pages", "social_section"],
      order: 2,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 890,
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "link-3",
      title: "Direct Mentor Support (Telegram)",
      category: "Support",
      url: "https://t.me/tradewithjahid",
      description: "Message Jahid directly with your account ID for instant course & signal approval.",
      iconName: "MessageCircle",
      buttonLabel: "Message Mentor",
      displayLocations: ["contact_page", "hero", "footer"],
      order: 3,
      isActive: true,
      isFeatured: true,
      openInNewTab: true,
      clickCount: 654,
      createdAt: "2026-01-10T10:00:00Z"
    }
  ],
  submissions: [
    {
      id: "SUB-9482",
      courseId: "course-binary",
      courseTitle: "Binary Trading Mastery",
      accountId: "PO-8923419",
      telegramHandle: "@arif_trader",
      userEmail: "arif@gmail.com",
      status: "Pending Review",
      reviewNotes: "Awaiting partner dashboard sync.",
      createdAt: "2026-10-13T07:15:00Z",
      updatedAt: "2026-10-13T07:15:00Z"
    },
    {
      id: "SUB-8023",
      courseId: "service-signals",
      courseTitle: "VIP Trading Signals",
      accountId: "QX-1049281",
      telegramHandle: "@rahul_invest",
      userEmail: "rahul@yahoo.com",
      status: "Pending Review",
      reviewNotes: "New submission submitted today.",
      createdAt: "2026-10-13T08:02:00Z",
      updatedAt: "2026-10-13T08:02:00Z"
    }
  ],
  portfolio: [
    {
      id: "port-1",
      title: "EUR/USD London Killzone Liquidity Sweep",
      instrument: "Forex",
      pair: "EUR/USD",
      outcome: "WIN",
      riskReward: "1:4.8 RR",
      profitPercentage: "+4.8%",
      screenshotUrl: "/images/forex_course_cover_1791906599347.jpg",
      date: "October 2026",
      educationalNote: "Asian session highs were swept at London Open followed by a clean 5-minute Market Structure Shift (MSS). Entered on the Fair Value Gap retest with 7 pip stop loss.",
      published: true,
      order: 1
    },
    {
      id: "port-2",
      title: "USD/JPY 60-Second Bollinger Squeeze Breakout",
      instrument: "Binary",
      pair: "USD/JPY",
      outcome: "WIN",
      riskReward: "88% Payout",
      profitPercentage: "+88%",
      screenshotUrl: "/images/binary_course_cover_1791906598444.jpg",
      date: "October 2026",
      educationalNote: "Volatility contraction preceded a strong rejection candle touching the lower deviation band. Entered 1-minute CALL option immediately upon rejection confirmation.",
      published: true,
      order: 2
    },
    {
      id: "port-3",
      title: "Gold (XAU/USD) Daily Order Block Bounce",
      instrument: "Forex",
      pair: "XAU/USD",
      outcome: "WIN",
      riskReward: "1:5.5 RR",
      profitPercentage: "+5.5%",
      screenshotUrl: "/images/hero_trading_terminal_1791906597313.jpg",
      date: "September 2026",
      educationalNote: "Institutional daily demand mitigation into previous week's discount level. Clear bullish engulfing confirmation on the 15-minute timeframe.",
      published: true,
      order: 3
    },
    {
      id: "port-4",
      title: "Alpha Engine Quant Bot Forward Run",
      instrument: "Bot",
      pair: "Deriv Synthetic / Vol 75",
      outcome: "PROFIT",
      riskReward: "Automated",
      profitPercentage: "+24.6% Month",
      screenshotUrl: "/images/trading_bot_cover_1791906598974.jpg",
      date: "September 2026",
      educationalNote: "Dual-engine algorithmic execution filtering choppy market conditions with strict daily loss cap of 2.5% max equity risk.",
      published: true,
      order: 4
    }
  ],
  books: [
    {
      id: "book-1",
      title: "Institutional Candlestick Psychology & Wick Dynamics",
      author: "Jahid Hossain",
      description: "Master 60-second to 5-minute binary price action, order flow exhaustion, and false breakout filters.",
      pdfUrl: "/uploads/institutional_candlestick_psychology.pdf",
      coverImage: "/images/binary_course_cover_1791906598444.jpg",
      published: true,
      order: 1,
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "book-2",
      title: "Smart Money Concepts & Forex Liquidity Manual",
      author: "Jahid Hossain",
      description: "Comprehensive guide to institutional fair value gaps, liquidity sweeps, market structure shifts, and 1:5 RR setups.",
      pdfUrl: "/uploads/smc_forex_liquidity_manual.pdf",
      coverImage: "/images/forex_course_cover_1791906599347.jpg",
      published: true,
      order: 2,
      createdAt: "2026-01-12T10:00:00Z"
    },
    {
      id: "book-3",
      title: "Advanced Risk Management & Compound Growth Handbook",
      author: "Jahid Hossain",
      description: "Mathematical framework for protecting capital, avoiding emotional tilt, and scaling accounts systematically.",
      pdfUrl: "/uploads/risk_management_compound_handbook.pdf",
      coverImage: "/images/hero_trading_terminal_1791906597313.jpg",
      published: true,
      order: 3,
      createdAt: "2026-01-15T10:00:00Z"
    }
  ],
  strategies: [
    {
      id: "strat-1",
      title: "London Session Sweep & Mitigation Strategy",
      category: "Forex Institutional",
      description: "Identify key Asia session highs/sweeps, wait for market structure break (MSB), and enter on 15m order block mitigation.",
      imageUrl: "/images/hero_trading_terminal_1791906597313.jpg",
      winRate: "86.4% Win Rate",
      published: true,
      order: 1,
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "strat-2",
      title: "1-Minute Binary Bollinger Squeeze Rejection",
      category: "Binary Options",
      description: "Look for volatility contraction on Bollinger Bands paired with RSI divergence and wick rejection at major support/resistance.",
      imageUrl: "/images/binary_course_cover_1791906598444.jpg",
      winRate: "82.1% Payout Accuracy",
      published: true,
      order: 2,
      createdAt: "2026-01-12T10:00:00Z"
    },
    {
      id: "strat-3",
      title: "Algorithmic Trend Following Bot Setup",
      category: "Quantitative Bot",
      description: "Multi-timeframe moving average crossover combined with ATR trailing stop limits for hands-free trend capture.",
      imageUrl: "/images/trading_bot_cover_1791906598974.jpg",
      winRate: "79.8% Net ROI",
      published: true,
      order: 3,
      createdAt: "2026-01-15T10:00:00Z"
    }
  ],
  auditLogs: [
    {
      id: "log-1",
      action: "System Initialization",
      details: "Trading With Jahid master system started with institutional configuration.",
      timestamp: "2026-10-13T08:00:00Z"
    }
  ],
  adminAuth: {
    username: "admin",
    passwordHash: "jahidvip2026",
    sessionTokens: []
  }
};
var Database = class {
  constructor() {
    this.data = this.loadFromFile();
  }
  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        return {
          ...INITIAL_DATA,
          ...parsed,
          courses: Array.isArray(parsed.courses) ? parsed.courses : INITIAL_DATA.courses,
          links: Array.isArray(parsed.links) ? parsed.links : INITIAL_DATA.links,
          submissions: Array.isArray(parsed.submissions) ? parsed.submissions : INITIAL_DATA.submissions,
          portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : INITIAL_DATA.portfolio,
          books: Array.isArray(parsed.books) ? parsed.books : INITIAL_DATA.books,
          strategies: Array.isArray(parsed.strategies) ? parsed.strategies : INITIAL_DATA.strategies,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : INITIAL_DATA.auditLogs,
          settings: { ...INITIAL_DATA.settings, ...parsed.settings || {} },
          animations: { ...INITIAL_DATA.animations, ...parsed.animations || {} },
          adminAuth: { ...INITIAL_DATA.adminAuth, ...parsed.adminAuth || {} }
        };
      }
    } catch (e) {
      console.warn("Warning: Error loading data from file, falling back to initial data:", e);
    }
    this.saveToFile(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  saveToFile(data) {
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Warning: Could not save data to file (read-only filesystem):", e);
    }
  }
  async get() {
    return this.data;
  }
  async update(updater) {
    updater(this.data);
    this.saveToFile(this.data);
    return this.data;
  }
  async logAction(action, details, ip) {
    try {
      const log = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
        action,
        details,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ip
      };
      this.data.auditLogs.unshift(log);
      if (this.data.auditLogs.length > 200) {
        this.data.auditLogs.pop();
      }
      this.saveToFile(this.data);
    } catch (e) {
      console.warn("Warning: logAction failed:", e);
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
  if (req.url.startsWith("/api") || req.url.startsWith("/public") || req.url.startsWith("/admin")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
var UPLOADS_DIR = (() => {
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
app.use("/uploads", express.static(UPLOADS_DIR));
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
        const maxAge = 30 * 24 * 60 * 60 * 1e3;
        if (isNaN(timestamp) || Date.now() - timestamp > maxAge || Date.now() < timestamp - 6e4) {
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
api.delete("/admin/submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.submissions = (d.submissions || []).filter((s) => s.id !== id);
    });
    await db.logAction("Submission Deleted", `Submission ${id} was deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete submission" });
  }
});
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
api.delete("/admin/courses/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.courses = (d.courses || []).filter((c) => c.id !== id);
    });
    await db.logAction("Course Deleted", `Course ${id} was deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});
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
api.delete("/admin/links/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.links = (d.links || []).filter((l) => l.id !== id);
    });
    await db.logAction("Link Deleted", `Link ${id} was deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete link" });
  }
});
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
api.delete("/admin/portfolio/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.portfolio = (d.portfolio || []).filter((p) => p.id !== id);
    });
    await db.logAction("Portfolio Deleted", `Portfolio item ${id} was deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete portfolio item" });
  }
});
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
api.delete("/admin/books/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.books = (d.books || []).filter((item) => item.id !== id);
    });
    await db.logAction("Book Deleted", `Book ${id} deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete book" });
  }
});
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
api.delete("/admin/strategies/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update((d) => {
      d.strategies = (d.strategies || []).filter((item) => item.id !== id);
    });
    await db.logAction("Strategy Deleted", `Strategy ${id} deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete strategy" });
  }
});
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
    const targetPath = path2.join(UPLOADS_DIR, uniqueName);
    try {
      fs2.writeFileSync(targetPath, buffer);
    } catch (e) {
      console.warn("Could not write uploaded file to disk:", e);
    }
    const publicUrl = dataUrl;
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
    const files = fs2.readdirSync(UPLOADS_DIR).filter((f) => /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(f)).map((fileName) => {
      const stats = fs2.statSync(path2.join(UPLOADS_DIR, fileName));
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
    const targetPath = path2.join(UPLOADS_DIR, safeName);
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
    const files = fs2.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)) {
        try {
          fs2.unlinkSync(path2.join(UPLOADS_DIR, f));
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
api.delete("/admin/audit-logs", requireAdmin, async (_req, res) => {
  try {
    await db.update((d) => {
      d.auditLogs = [];
    });
    await db.logAction("Audit Logs Cleared", "All system action logs were cleared");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear audit logs" });
  }
});
api.delete("/admin/submissions-all", requireAdmin, async (_req, res) => {
  try {
    await db.update((d) => {
      d.submissions = [];
    });
    await db.logAction("All Submissions Cleared", "Administrator cleared all account ID submissions");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear submissions" });
  }
});
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
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path3.resolve(__dirname3, "dist");
  const distIndex = path3.resolve(distPath, "index.html");
  if (isProd && !fs3.existsSync(distIndex)) {
    console.log("Production mode detected but dist/index.html is missing. Building app automatically...");
    try {
      execSync("npm run build", { stdio: "inherit" });
    } catch (e) {
      console.error("Auto-build failed:", e);
    }
  }
  if (!isProd || !fs3.existsSync(distIndex)) {
    console.log("Starting Vite development/middleware server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app_default.use(vite.middlewares);
  } else {
    console.log("Serving production static files from dist...");
    app_default.use(express2.static(distPath));
    app_default.get("*", (_req, res) => {
      res.sendFile(path3.resolve(distPath, "index.html"));
    });
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
