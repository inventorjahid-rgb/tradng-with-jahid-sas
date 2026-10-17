import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestoreDb: any = null;
try {
  const configPaths = [
    path.resolve(__dirname, 'firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, '../firebase-applet-config.json')
  ];
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (configData.apiKey && configData.projectId) {
        const app = initializeApp(configData, 'server-app-db');
        firestoreDb = getFirestore(app, configData.firestoreDatabaseId);
        break;
      }
    }
  }
} catch (e) {
  console.warn('Warning: Could not initialize Firebase in server/db.ts:', e);
}

const LOCAL_DATA_PATH = path.resolve(process.cwd(), 'data/db.json');
const TMP_DATA_PATH = path.resolve('/tmp', 'trading_jahid_db.json');

function getDbFilePath(): string {
  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, '.test'), 'test');
    fs.unlinkSync(path.join(dir, '.test'));
    return LOCAL_DATA_PATH;
  } catch {
    try {
      if (!fs.existsSync('/tmp')) {
        fs.mkdirSync('/tmp', { recursive: true });
      }
      return TMP_DATA_PATH;
    } catch {
      return LOCAL_DATA_PATH;
    }
  }
}

const DATA_FILE_PATH = getDbFilePath();

export interface WebsiteSettings {
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTitlePrimary?: string;
  heroTitleHighlight?: string;
  heroBadgeText?: string;
  coursesBadgeText?: string;
  coursesTitlePrimary?: string;
  coursesTitleHighlight?: string;
  coursesSubtitle?: string;
  profileImageUrl: string;
  logoUrl: string;
  heroBannerUrl: string;
  telegramCommunityUrl: string;
  telegramAdminUrl: string;
  contactEmail: string;
  whatsappUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentGold: string;
  bgColor: string;
  aboutBio: string;
  aboutJourney: string;
  aboutExpertise: string[];
  aboutStats: { label: string; value: string }[];
  footerDisclaimer: string;
  riskNotice: string;
}

export interface AnimationSettings {
  enable3D: boolean;
  enableParticles: boolean;
  enableCharts: boolean;
  enableCursor: boolean;
  enableScroll: boolean;
  intensity: 'low' | 'medium' | 'high';
  speed: number;
  particleDensity: number;
  backgroundStyle: 'matte_obsidian' | 'emerald_mesh' | 'cyber_grid';
  enableOnMobile: boolean;
}

export interface CourseService {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  coverImage: string;
  accessMode: 'new_account' | 'existing_id';
  registrationUrl: string;
  joinUrl: string;
  modules: string[];
  requirements: string;
  faqs: { question: string; answer: string }[];
  published: boolean;
  featured: boolean;
  order: number;
  createdAt: string;
}

export interface SocialLink {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
  iconName: string;
  buttonLabel: string;
  displayLocations: ('navbar' | 'hero' | 'social_section' | 'course_pages' | 'community_page' | 'contact_page' | 'footer' | 'floating')[];
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  openInNewTab: boolean;
  clickCount: number;
  lastClickedAt?: string;
  createdAt: string;
}

export interface AccountSubmission {
  id: string;
  courseId: string;
  courseTitle: string;
  accountId: string;
  telegramHandle: string;
  userEmail?: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Verified';
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  instrument: 'Binary' | 'Forex' | 'Bot' | 'Crypto';
  pair: string;
  outcome: 'WIN' | 'PROFIT' | 'ANALYSIS';
  riskReward: string;
  profitPercentage: string;
  screenshotUrl: string;
  date: string;
  educationalNote: string;
  published: boolean;
  order: number;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  description: string;
  pdfUrl: string;
  coverImage: string;
  published: boolean;
  order: number;
  createdAt: string;
}

export interface StrategyItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  winRate: string;
  published: boolean;
  order: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
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
    intensity: 'medium',
    speed: 1.0,
    particleDensity: 75,
    backgroundStyle: 'emerald_mesh',
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

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromFile();
    this.syncFromFirestoreAsync();
  }

  private async syncFromFirestoreAsync() {
    if (!firestoreDb) return;
    try {
      const docRef = doc(firestoreDb, 'app_state', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const parsed = JSON.parse(snap.data().payloadString || '{}');
        this.data = {
          ...INITIAL_DATA,
          ...parsed,
          courses: Array.isArray(parsed.courses) ? parsed.courses : INITIAL_DATA.courses,
          links: Array.isArray(parsed.links) ? parsed.links : INITIAL_DATA.links,
          submissions: Array.isArray(parsed.submissions) ? parsed.submissions : INITIAL_DATA.submissions,
          portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : INITIAL_DATA.portfolio,
          books: Array.isArray(parsed.books) ? parsed.books : INITIAL_DATA.books,
          strategies: Array.isArray(parsed.strategies) ? parsed.strategies : INITIAL_DATA.strategies,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : INITIAL_DATA.auditLogs,
          settings: { ...INITIAL_DATA.settings, ...(parsed.settings || {}) },
          animations: { ...INITIAL_DATA.animations, ...(parsed.animations || {}) },
          adminAuth: { ...INITIAL_DATA.adminAuth, ...(parsed.adminAuth || {}) }
        };
        try {
          const jsonStr = JSON.stringify(this.data, null, 2);
          fs.writeFileSync(TMP_DATA_PATH, jsonStr, 'utf-8');
          fs.writeFileSync(LOCAL_DATA_PATH, jsonStr, 'utf-8');
        } catch {}
      } else {
        await this.saveToFirestore(this.data);
      }
    } catch (e) {
      console.warn('Warning: Failed to sync database from Firestore at startup:', e);
    }
  }

  private async saveToFirestore(data: DatabaseSchema) {
    if (!firestoreDb) return;
    try {
      const cloned = JSON.parse(JSON.stringify(data));
      if (cloned.auditLogs && cloned.auditLogs.length > 30) {
        cloned.auditLogs = cloned.auditLogs.slice(0, 30);
      }
      // If any URL starts with data:, replace with default fallback to keep document size < 1MB
      if (cloned.settings?.logoUrl?.startsWith('data:')) {
        cloned.settings.logoUrl = '/images/trading_with_jahid_logo_1791908793141.jpg';
      }
      if (cloned.settings?.profileImageUrl?.startsWith('data:')) {
        cloned.settings.profileImageUrl = '/images/jahid_profile_avatar_1791906596676.jpg';
      }
      if (cloned.settings?.heroBannerUrl?.startsWith('data:')) {
        cloned.settings.heroBannerUrl = '/images/hero_trading_terminal_1791906597313.jpg';
      }

      const payloadString = JSON.stringify(cloned);
      if (payloadString.length > 950000) {
        console.warn('Warning: Database payload size exceeds 950KB. Trimming items.');
        if (cloned.courses) cloned.courses = cloned.courses.slice(0, 20);
        if (cloned.portfolio) cloned.portfolio = cloned.portfolio.slice(0, 20);
        if (cloned.submissions) cloned.submissions = cloned.submissions.slice(0, 50);
      }

      const docRef = doc(firestoreDb, 'app_state', 'main');
      await setDoc(docRef, {
        payloadString: JSON.stringify(cloned),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Warning: Failed to save database to Firestore (persisted locally):', e);
    }
  }

  private loadFromFile(): DatabaseSchema {
    try {
      let targetPath = DATA_FILE_PATH;
      try {
        const localExists = fs.existsSync(LOCAL_DATA_PATH);
        const tmpExists = fs.existsSync(TMP_DATA_PATH);
        if (localExists && tmpExists) {
          const localStat = fs.statSync(LOCAL_DATA_PATH);
          const tmpStat = fs.statSync(TMP_DATA_PATH);
          targetPath = tmpStat.mtime > localStat.mtime ? TMP_DATA_PATH : LOCAL_DATA_PATH;
        } else if (tmpExists) {
          targetPath = TMP_DATA_PATH;
        } else if (localExists) {
          targetPath = LOCAL_DATA_PATH;
        }
      } catch {}

      if (fs.existsSync(targetPath)) {
        const fileContent = fs.readFileSync(targetPath, 'utf-8');
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
          settings: { ...INITIAL_DATA.settings, ...(parsed.settings || {}) },
          animations: { ...INITIAL_DATA.animations, ...(parsed.animations || {}) },
          adminAuth: { ...INITIAL_DATA.adminAuth, ...(parsed.adminAuth || {}) }
        };
      }
    } catch (e) {
      console.warn('Warning: Error loading data from file, falling back to initial data:', e);
    }
    
    this.saveToFile(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private async saveToFile(data: DatabaseSchema) {
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      const dir = path.dirname(LOCAL_DATA_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LOCAL_DATA_PATH, jsonStr, 'utf-8');
    } catch (e) {
      console.warn('Warning: Could not save data to LOCAL_DATA_PATH:', e);
    }

    try {
      if (!fs.existsSync('/tmp')) {
        fs.mkdirSync('/tmp', { recursive: true });
      }
      fs.writeFileSync(TMP_DATA_PATH, jsonStr, 'utf-8');
    } catch (e) {
      console.warn('Warning: Could not save data to TMP_DATA_PATH:', e);
    }

    await this.saveToFirestore(data);
  }

  public async get(): Promise<DatabaseSchema> {
    return this.data;
  }

  public async update(updater: (data: DatabaseSchema) => void): Promise<DatabaseSchema> {
    updater(this.data);
    await this.saveToFile(this.data);
    return this.data;
  }

  public async logAction(action: string, details: string, ip?: string) {
    try {
      const log: AuditLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip
      };
      this.data.auditLogs.unshift(log);
      if (this.data.auditLogs.length > 200) {
        this.data.auditLogs.pop();
      }
      await this.saveToFile(this.data);
    } catch (e) {
      console.warn('Warning: logAction failed:', e);
    }
  }
}

export const db = new Database();
