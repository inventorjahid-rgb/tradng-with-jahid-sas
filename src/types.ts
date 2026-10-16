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
  joinUrl?: string; // only returned to admin or verified users
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

export interface PublicDataPayload {
  settings: WebsiteSettings;
  animations: AnimationSettings;
  courses: CourseService[];
  links: SocialLink[];
  portfolio: PortfolioItem[];
  books: BookItem[];
  strategies: StrategyItem[];
}

