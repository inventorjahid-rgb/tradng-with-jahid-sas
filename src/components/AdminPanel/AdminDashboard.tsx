import React, { useState, useEffect } from 'react';
import {
  WebsiteSettings,
  AnimationSettings,
  CourseService,
  SocialLink,
  PortfolioItem,
  BookItem,
  StrategyItem,
  AccountSubmission,
  AuditLog
} from '../../types.ts';
import {
  adminLogin,
  adminLogout,
  verifyAdminSession,
  fetchAdminOverview,
  fetchAdminSubmissions,
  updateSubmission,
  deleteSubmission,
  fetchAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  fetchAdminLinks,
  createLink,
  updateLink,
  deleteLink,
  fetchAdminPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  fetchAdminBooks,
  createBook,
  updateBook,
  deleteBook,
  fetchAdminStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  updateWebsiteSettings,
  updateAnimationSettings,
  fetchAuditLogs,
  changeAdminPassword,
  clearAdminToken,
  fetchMediaLibrary,
  deleteMediaFile,
  clearAuditLogs,
  clearAllSubmissions,
  uploadImage,
  banTraderId
} from '../../api.ts';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Share2,
  TrendingUp,
  Sparkles,
  Settings,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Save,
  Search,
  Filter,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  FileText,
  Copy,
  UploadCloud,
  Ban,
  Menu
} from 'lucide-react';
import { ImageUploadWidget } from './ImageUploadWidget.tsx';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPublicData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onRefreshPublicData,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'submissions' | 'courses' | 'books' | 'strategies' | 'links' | 'portfolio' | 'animations' | 'settings' | 'security' | 'media'
  >('overview');

  // Loaded Data
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<AccountSubmission[]>([]);
  const [courses, setCourses] = useState<CourseService[]>([]);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<{ fileName: string; url: string; sizeKb: number; createdAt: string }[]>([]);
  const [settingsForm, setSettingsForm] = useState<Partial<WebsiteSettings>>({});
  const [animationsForm, setAnimationsForm] = useState<Partial<AnimationSettings>>({});

  // Submissions Filter & Search
  const [subStatusFilter, setSubStatusFilter] = useState<string>('all');
  const [subSearchQuery, setSubSearchQuery] = useState<string>('');
  const [directBanId, setDirectBanId] = useState<string>('');
  const [banningLoading, setBanningLoading] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Editing Modals / Inline states
  const [editingCourse, setEditingCourse] = useState<Partial<CourseService> | null>(null);
  const [editingLink, setEditingLink] = useState<Partial<SocialLink> | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Partial<PortfolioItem> | null>(null);
  const [editingBook, setEditingBook] = useState<Partial<BookItem> | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<Partial<StrategyItem> | null>(null);
  const [reviewingSub, setReviewingSub] = useState<AccountSubmission | null>(null);

  // Delete Confirmation State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmButtonText?: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmButtonText: 'Delete Permanently',
    onConfirm: async () => {},
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Security password state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    setCheckingAuth(true);
    const valid = await verifyAdminSession();
    if (!valid) {
      clearAdminToken();
    }
    setIsAuthenticated(valid);
    setCheckingAuth(false);
    if (valid) {
      loadAllAdminData();
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [overview, subs, crs, lnk, prt, bks, str, logs, media] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminSubmissions(),
        fetchAdminCourses(),
        fetchAdminLinks(),
        fetchAdminPortfolio(),
        fetchAdminBooks(),
        fetchAdminStrategies(),
        fetchAuditLogs(),
        fetchMediaLibrary().catch(() => [])
      ]);
      setOverviewData(overview);
      setSubmissions(subs);
      setCourses(crs);
      setLinks(lnk);
      setPortfolio(prt);
      setBooks(bks);
      setStrategies(str);
      setAuditLogs(logs);
      setMediaLibrary(media || []);

      // Initialize forms from overview or public
      const res = await fetch(`/api/public/data?_t=${Date.now()}`);
      if (res.ok) {
        const publicData = await res.json();
        setSettingsForm(publicData.settings || {});
        setAnimationsForm(publicData.animations || {});
      }
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      if (err?.message && (err.message.includes('Unauthorized') || err.message.includes('token') || err.message.includes('401'))) {
        clearAdminToken();
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await adminLogin(loginUsername, loginPassword);
      setIsAuthenticated(true);
      setLoginPassword('');
      loadAllAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
    clearAdminToken();
  };

  const notifySaved = (msg: string = 'Saved successfully') => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
    onRefreshPublicData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden text-left">
      <div className="relative w-full max-w-7xl h-full sm:h-[94vh] bg-[#0c1210] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Bar */}
        <div className="p-3 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#080B0A] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isAuthenticated && (
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="md:hidden p-2 text-yellow-400 bg-white/5 hover:bg-white/10 rounded-xl border border-yellow-500/20 shrink-0 cursor-pointer"
                title="Toggle Admin Menu"
              >
                {mobileSidebarOpen ? <X className="w-4 h-4 text-yellow-400" /> : <Menu className="w-4 h-4 text-yellow-400" />}
              </button>
            )}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_12px_rgba(0,208,132,0.3)] shrink-0 bg-black">
              <img
                src={settingsForm.logoUrl || '/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg'}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/trading_with_jahid_logo_1791908793141.jpg';
                }}
              />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Trading With Jahid</span>
                <span className="text-[10px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30 shrink-0">
                  ADMIN
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-mono text-[#00D084] bg-[#00D084]/10 px-3 py-1 rounded border border-[#00D084]/30 animate-pulse">
                ✓ {saveStatus}
              </span>
            )}

            {isAuthenticated && (
              <button
                onClick={loadAllAdminData}
                disabled={loading}
                title="Refresh Database"
                className="p-2 text-[#A5B0AA] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00D084]' : ''}`} />
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-[#A5B0AA] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If Checking Auth */}
        {checkingAuth ? (
          <div className="flex-1 flex items-center justify-center text-sm font-mono text-[#A5B0AA]">
            Verifying administrative credentials...
          </div>
        ) : !isAuthenticated ? (
          /* LOGIN VIEW */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#080B0A]">
            <div className="w-full max-w-md p-8 glass-panel rounded-2xl border border-white/10 shadow-2xl space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37]/70 shadow-[0_0_20px_rgba(0,208,132,0.35)] mx-auto bg-[#111715]">
                  <img
                    src={settingsForm.logoUrl || '/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg'}
                    alt="Trading With Jahid Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/trading_with_jahid_logo_1791908793141.jpg';
                    }}
                  />
                </div>
                <h3 className="text-xl font-bold text-white">Administrator Login</h3>
                <p className="text-xs text-[#A5B0AA]">
                  Access restricted to authorized Trading With Jahid personnel.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/90 block mb-1">Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#080B0A] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/90 block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#080B0A] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Enter Control Panel
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Mobile Horizontal Quick Tab Bar */}
            <div className="md:hidden flex items-center gap-1.5 px-3 py-2.5 bg-[#090f0d] border-b border-white/[0.08] overflow-x-auto whitespace-nowrap text-xs shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'submissions', label: 'Submissions', icon: Users, badge: submissions.filter(s => s.status === 'Pending Review').length },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'books', label: 'Books', icon: FileText },
                { id: 'strategies', label: 'Strategies', icon: ImageIcon },
                { id: 'links', label: 'Links', icon: Share2 },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'security', label: 'Security', icon: Shield },
              ].map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer shrink-0 ${
                      active
                        ? 'bg-[#00D084] text-black font-bold shadow-sm'
                        : 'text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[9px] font-mono px-1 rounded-full font-bold ${active ? 'bg-black text-[#00D084]' : 'bg-[#D4AF37] text-black'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              {/* Mobile Slide-Over Sidebar Drawer */}
              {mobileSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                  <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                  <div className="relative w-72 max-w-[85vw] bg-[#090f0d] border-r border-yellow-500/30 p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-xs font-mono font-bold text-yellow-400">ADMIN SECTIONS</span>
                        <button
                          onClick={() => setMobileSidebarOpen(false)}
                          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <nav className="space-y-1 text-xs">
                        {[
                          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
                          { id: 'submissions', label: 'Account Submissions', icon: Users, badge: submissions.filter(s => s.status === 'Pending Review').length },
                          { id: 'courses', label: 'Courses & Services', icon: BookOpen },
                          { id: 'books', label: 'Trading Books (PDFs)', icon: FileText, badge: books.length },
                          { id: 'strategies', label: 'Strategy Pictures', icon: ImageIcon, badge: strategies.length },
                          { id: 'links', label: 'Social & Custom Links', icon: Share2 },
                          { id: 'settings', label: 'Website Settings', icon: Settings },
                          { id: 'security', label: 'Security & Logs', icon: Shield },
                        ].map(item => {
                          const Icon = item.icon;
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id as any);
                                setMobileSidebarOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#00D084] text-black font-bold shadow-sm'
                                  : 'text-[#A5B0AA] hover:text-white hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </div>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-black text-[#00D084]' : 'bg-[#D4AF37] text-black'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] text-[11px] text-[#A5B0AA] space-y-1 font-mono">
                      <div>HOST: Cloud Run</div>
                      <div className="text-[#00D084]">DB: Persistent JSON</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Sidebar Navigation */}
              <aside className="hidden md:flex w-60 border-r border-white/[0.08] bg-[#090f0d] flex-col justify-between p-3 shrink-0 overflow-y-auto">
                <nav className="space-y-1 text-xs">
                  {[
                    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
                    { id: 'submissions', label: 'Account Submissions', icon: Users, badge: submissions.filter(s => s.status === 'Pending Review').length },
                    { id: 'courses', label: 'Courses & Services', icon: BookOpen },
                    { id: 'books', label: 'Trading Books (PDFs)', icon: FileText, badge: books.length },
                    { id: 'strategies', label: 'Strategy Pictures', icon: ImageIcon, badge: strategies.length },
                    { id: 'links', label: 'Social & Custom Links', icon: Share2 },
                    { id: 'settings', label: 'Website Settings', icon: Settings },
                    { id: 'security', label: 'Security & Logs', icon: Shield },
                  ].map(item => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#00D084] text-black font-semibold shadow-sm'
                            : 'text-[#A5B0AA] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-black text-[#00D084]' : 'bg-[#D4AF37] text-black'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] text-[11px] text-[#A5B0AA] space-y-1 font-mono">
                  <div>HOST: Cloud Run</div>
                  <div className="text-[#00D084]">DB: Persistent JSON</div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 bg-[#080B0A] overflow-y-auto p-3.5 sm:p-6 lg:p-8">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && overviewData && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">System Performance & Submissions</h3>
                    <p className="text-xs text-[#A5B0AA] mt-1">
                      Live overview of courses, account verification flow, and link click engagement.
                    </p>
                  </div>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#111715] border border-white/10">
                      <span className="text-xs text-[#A5B0AA]">Pending Review</span>
                      <div className="text-3xl font-extrabold text-[#D4AF37] font-mono mt-1 tabular-nums">
                        {overviewData.stats.pendingSubmissions}
                      </div>
                      <span className="text-[11px] text-[#A5B0AA] mt-1 block">Requires manual audit</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#111715] border border-white/10">
                      <span className="text-xs text-[#A5B0AA]">Approved / Verified</span>
                      <div className="text-3xl font-extrabold text-[#00D084] font-mono mt-1 tabular-nums">
                        {overviewData.stats.approvedSubmissions}
                      </div>
                      <span className="text-[11px] text-[#A5B0AA] mt-1 block">JOIN portal released</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#111715] border border-white/10">
                      <span className="text-xs text-[#A5B0AA]">Total Managed Links</span>
                      <div className="text-3xl font-extrabold text-white font-mono mt-1 tabular-nums">
                        {overviewData.stats.totalLinks}
                      </div>
                      <span className="text-[11px] text-[#A5B0AA] mt-1 block">Active social channels</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#111715] border border-white/10">
                      <span className="text-xs text-[#A5B0AA]">Total Link Clicks</span>
                      <div className="text-3xl font-extrabold text-white font-mono mt-1 tabular-nums">
                        {overviewData.stats.totalLinkClicks.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-[#A5B0AA] mt-1 block">Real traffic analytics</span>
                    </div>
                  </div>

                  {/* Two Columns: Recent Submissions & Top Clicked Links */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <div className="lg:col-span-7 bg-[#111715] rounded-2xl border border-white/10 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">Recent Account Submissions</h4>
                        <button
                          onClick={() => setActiveTab('submissions')}
                          className="text-xs text-[#00D084] hover:underline"
                        >
                          View All ({submissions.length})
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {submissions.slice(0, 5).map(sub => (
                          <div
                            key={sub.id}
                            className="p-3 bg-black/40 rounded-xl border border-white/[0.04] flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <div className="font-bold text-white">{sub.accountId}</div>
                              <div className="text-[#A5B0AA] text-[11px]">{sub.courseTitle} · {sub.telegramHandle}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                sub.status === 'Approved'
                                  ? 'bg-[#00D084]/20 text-[#00D084]'
                                  : sub.status === 'Rejected'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-[#111715] rounded-2xl border border-white/10 p-6 space-y-4">
                      <h4 className="text-sm font-bold text-white">Top Clicked Channels</h4>
                      <div className="space-y-2.5">
                        {overviewData.topLinks?.map((lnk: SocialLink) => (
                          <div
                            key={lnk.id}
                            className="p-3 bg-black/40 rounded-xl border border-white/[0.04] flex items-center justify-between text-xs"
                          >
                            <div className="truncate mr-2">
                              <span className="font-bold text-white block truncate">{lnk.title}</span>
                              <span className="text-[#A5B0AA] text-[11px] font-mono">{lnk.category}</span>
                            </div>
                            <span className="text-[#00D084] font-mono font-bold shrink-0">
                              {lnk.clickCount.toLocaleString()} clicks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ACCOUNT ID SUBMISSIONS */}
              {activeTab === 'submissions' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Account ID Submissions & Review</h3>
                      <p className="text-xs text-[#A5B0AA]">
                        Verify trader Broker Account IDs. Approving an ID unlocks their configured JOIN portal link.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                      {/* Mobile & Desktop Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        {[
                          { id: 'all', label: 'All', count: submissions.length },
                          { id: 'Pending Review', label: 'Pending', count: submissions.filter(s => s.status === 'Pending Review').length, badgeColor: 'bg-yellow-400/20 text-yellow-400' },
                          { id: 'Approved', label: 'Approved', count: submissions.filter(s => s.status === 'Approved').length, badgeColor: 'bg-[#00D084]/20 text-[#00D084]' },
                          { id: 'Rejected', label: 'Banned', count: submissions.filter(s => s.status === 'Rejected').length, badgeColor: 'bg-red-500/20 text-red-400' },
                        ].map(chip => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => setSubStatusFilter(chip.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                              subStatusFilter === chip.id
                                ? 'bg-[#00D084] text-black border-[#00D084] font-bold shadow-md'
                                : 'bg-[#111715] text-[#A5B0AA] border-white/10 hover:border-white/20'
                            }`}
                          >
                            <span>{chip.label}</span>
                            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${subStatusFilter === chip.id ? 'bg-black text-[#00D084]' : chip.badgeColor || 'bg-white/10 text-white'}`}>
                              {chip.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {submissions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              title: 'Delete All Submissions?',
                              message: 'Are you sure you want to delete ALL submitted account IDs? This will permanently wipe the submission log.',
                              confirmButtonText: 'Yes, Delete All',
                              onConfirm: async () => {
                                setSubmissions([]);
                                await clearAllSubmissions();
                                await loadAllAdminData();
                                notifySaved('All account submissions deleted');
                              }
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-xl transition-colors cursor-pointer border border-red-500/20 flex items-center gap-1.5 shrink-0 ml-auto"
                          title="Delete all submissions"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Clear All Submissions</span>
                          <span className="sm:hidden">Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Ban Trader ID Card */}
                  <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <Ban className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Ban Trader ID</span>
                          <span className="text-[10px] text-red-400 font-mono">(ট্রেডার আইডি ব্যান করুন)</span>
                        </div>
                        <div className="text-[11px] text-[#A5B0AA]">
                          যেকোনো আইডি এখানে দিয়ে ব্যান করলে ওই আইডি দিয়ে আর কখনোই ভিআইপি লিংক পাওয়া যাবে না।
                        </div>
                      </div>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!directBanId.trim()) return;
                        try {
                          setBanningLoading(true);
                          await banTraderId(directBanId.trim(), 'Banned by admin: Trader ID blacklisted from VIP access.');
                          const banned = directBanId.trim();
                          setDirectBanId('');
                          await loadAllAdminData();
                          notifySaved(`Trader ID ${banned} has been BANNED.`);
                        } catch (err: any) {
                          alert(err.message || 'Failed to ban ID');
                        } finally {
                          setBanningLoading(false);
                        }
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                    >
                      <input
                        type="text"
                        placeholder="Enter ID to Ban (e.g. 984102)..."
                        value={directBanId}
                        onChange={e => setDirectBanId(e.target.value)}
                        className="px-3 py-2.5 bg-black border border-red-500/30 rounded-xl text-xs text-white placeholder:text-neutral-500 font-mono flex-1 sm:w-52 focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="submit"
                        disabled={banningLoading || !directBanId.trim()}
                        className="px-4 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                      >
                        {banningLoading ? 'Banning...' : 'Ban ID'}
                      </button>
                    </form>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#A5B0AA] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search Account ID, Telegram handle, or Ref ID..."
                      value={subSearchQuery}
                      onChange={e => setSubSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111715] border border-white/10 rounded-xl text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00D084]"
                    />
                  </div>

                  {/* SUBMISSIONS LIST: Dedicated Mobile Touch Cards (md:hidden) */}
                  <div className="md:hidden space-y-3">
                    {submissions
                      .filter(s => subStatusFilter === 'all' || s.status === subStatusFilter)
                      .filter(s =>
                        subSearchQuery === '' ||
                        s.accountId.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
                        s.telegramHandle.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
                        s.id.toLowerCase().includes(subSearchQuery.toLowerCase())
                      )
                      .map(sub => (
                        <div
                          key={sub.id}
                          className="p-4 bg-[#111715] rounded-2xl border border-white/10 shadow-lg space-y-3"
                        >
                          {/* Card Top: Trader ID & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] text-[#A5B0AA] font-mono">ID:</span>
                              <span className="font-mono text-base font-bold text-yellow-400 tracking-wide truncate">
                                {sub.accountId}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(sub.accountId);
                                  notifySaved(`Copied ${sub.accountId}`);
                                }}
                                title="Copy Trader ID"
                                className="p-1 text-gray-400 hover:text-white bg-white/5 rounded-lg shrink-0 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                                sub.status === 'Approved'
                                  ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40'
                                  : sub.status === 'Rejected'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                                  : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 animate-pulse'
                              }`}
                            >
                              {sub.status === 'Rejected' ? 'BANNED' : sub.status}
                            </span>
                          </div>

                          {/* Card Middle: Course, Telegram, Date */}
                          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] text-xs space-y-1.5 font-mono">
                            <div className="flex justify-between items-center text-white">
                              <span className="text-[#A5B0AA] font-sans">Service:</span>
                              <span className="font-bold truncate max-w-[200px]">{sub.courseTitle}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#A5B0AA] font-sans">Telegram:</span>
                              <span className="text-emerald-400 font-semibold">{sub.telegramHandle}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-neutral-400">
                              <span className="font-sans">Ref ID:</span>
                              <span>{sub.id} · {new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                            {sub.reviewNotes && (
                              <div className="pt-1.5 border-t border-white/5 text-[11px] text-yellow-300/80 font-sans">
                                💬 {sub.reviewNotes}
                              </div>
                            )}
                          </div>

                          {/* Mobile Action Buttons (Full-touch targets) */}
                          <div className="space-y-2 pt-1">
                            {sub.status !== 'Approved' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateSubmission(sub.id, {
                                    status: 'Approved',
                                    reviewNotes: 'Account verified under official partner registry.'
                                  });
                                  loadAllAdminData();
                                  notifySaved(`Approved ${sub.accountId}`);
                                }}
                                className="w-full py-2.5 text-xs font-bold bg-[#00D084] hover:bg-[#00e692] text-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Approve & Release VIP Link</span>
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                              {sub.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateSubmission(sub.id, {
                                      status: 'Rejected',
                                      reviewNotes: 'Banned by admin: Account ID invalid or blacklisted. No VIP link.'
                                    });
                                    loadAllAdminData();
                                    notifySaved(`Rejected & Banned ${sub.accountId}`);
                                  }}
                                  className="flex-1 py-2 text-xs font-semibold bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Reject and ban this Trader ID"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Reject & Ban</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setReviewingSub(sub)}
                                className="p-2 text-[#A5B0AA] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center gap-1 text-xs cursor-pointer"
                                title="Edit review notes"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Note</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmState({
                                    isOpen: true,
                                    title: `Delete Submission ${sub.id}?`,
                                    message: `Are you sure you want to permanently delete submission ${sub.id} (${sub.accountId})?`,
                                    confirmButtonText: 'Yes, Delete',
                                    onConfirm: async () => {
                                      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
                                      await deleteSubmission(sub.id);
                                      await loadAllAdminData();
                                      notifySaved(`Deleted ${sub.id}`);
                                    }
                                  });
                                }}
                                className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-xl border border-red-500/20 cursor-pointer"
                                title="Delete submission"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {submissions.filter(s => subStatusFilter === 'all' || s.status === subStatusFilter).length === 0 && (
                      <div className="p-8 text-center bg-[#111715] rounded-2xl border border-white/10 text-xs text-[#A5B0AA]">
                        No submissions match the current filter or search criteria.
                      </div>
                    )}
                  </div>

                  {/* DESKTOP TABLE: Visible on Tablets & Desktops (hidden md:block) */}
                  <div className="hidden md:block bg-[#111715] rounded-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-[#A5B0AA]">
                        <thead className="bg-[#0e1412] text-white/90 border-b border-white/[0.08] font-mono uppercase text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Ref ID</th>
                            <th className="py-3 px-4">Course / Service</th>
                            <th className="py-3 px-4">Account ID</th>
                            <th className="py-3 px-4">Telegram Handle</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Review Notes</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {submissions
                            .filter(s => subStatusFilter === 'all' || s.status === subStatusFilter)
                            .filter(s =>
                              subSearchQuery === '' ||
                              s.accountId.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
                              s.telegramHandle.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
                              s.id.toLowerCase().includes(subSearchQuery.toLowerCase())
                            )
                            .map(sub => (
                              <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-white">{sub.id}</td>
                                <td className="py-3 px-4 text-white">{sub.courseTitle}</td>
                                <td className="py-3 px-4 font-mono text-[#00D084] font-semibold">{sub.accountId}</td>
                                <td className="py-3 px-4 text-white font-mono">{sub.telegramHandle}</td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded font-semibold text-[10px] font-mono ${
                                      sub.status === 'Approved'
                                        ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30'
                                        : sub.status === 'Rejected'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                                        : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                                    }`}
                                  >
                                    {sub.status === 'Rejected' ? 'REJECTED / BANNED' : sub.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate text-[11px] text-neutral-400">
                                  {sub.reviewNotes || '—'}
                                </td>
                                <td className="py-3 px-4 text-right space-x-1 shrink-0">
                                  {sub.status !== 'Approved' && (
                                    <button
                                      onClick={async () => {
                                        await updateSubmission(sub.id, {
                                          status: 'Approved',
                                          reviewNotes: 'Account verified under official partner registry.'
                                        });
                                        loadAllAdminData();
                                        notifySaved(`Approved ${sub.id}`);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#00D084]/20 text-[#00D084] hover:bg-[#00D084] hover:text-black rounded transition-colors cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {sub.status !== 'Rejected' && (
                                    <button
                                      onClick={async () => {
                                        await updateSubmission(sub.id, {
                                          status: 'Rejected',
                                          reviewNotes: 'Banned by admin: Account ID invalid or blacklisted. No VIP link.'
                                        });
                                        loadAllAdminData();
                                        notifySaved(`Rejected & Banned ${sub.accountId}`);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded transition-colors cursor-pointer"
                                      title="Reject this submission and ban this Trader ID"
                                    >
                                      Reject & Ban ID
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setReviewingSub(sub)}
                                    title="Edit Notes"
                                    className="p-1 text-[#A5B0AA] hover:text-white rounded"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 inline" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setDeleteConfirmState({
                                        isOpen: true,
                                        title: `Delete Submission ${sub.id}?`,
                                        message: `Are you sure you want to permanently delete submission ${sub.id} (${sub.accountId})?`,
                                        confirmButtonText: 'Yes, Delete',
                                        onConfirm: async () => {
                                          setSubmissions(prev => prev.filter(s => s.id !== sub.id));
                                          await deleteSubmission(sub.id);
                                          await loadAllAdminData();
                                          notifySaved(`Deleted ${sub.id}`);
                                        }
                                      });
                                    }}
                                    title="Delete"
                                    className="p-1 text-neutral-600 hover:text-red-400 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COURSES & SERVICES */}
              {activeTab === 'courses' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Courses & Services Management</h3>
                      <p className="text-xs text-[#A5B0AA]">
                        Configure registration URLs, secret JOIN links, access modes, and curriculum modules.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingCourse({
                          title: '',
                          slug: '',
                          category: 'Binary Trading Course',
                          shortDesc: '',
                          fullDesc: '',
                          coverImage: '/images/binary_course_cover_1791906598444.jpg',
                          accessMode: 'new_account',
                          registrationUrl: 'https://pocketoption.com',
                          joinUrl: 'https://t.me/tradewithjahid',
                          modules: ['Module 1: Market Fundamentals', 'Module 2: Risk Management'],
                          requirements: 'Broker Trader ID verification',
                          faqs: [{ question: 'How long do I have access?', answer: 'Lifetime access after verified signup.' }],
                          published: true,
                          featured: false,
                          order: courses.length + 1
                        })
                      }
                      className="px-4 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Course / Service</span>
                    </button>
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map(course => (
                      <div
                        key={course.id}
                        className="bg-[#111715] rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between"
                      >
                        <div className="flex gap-4">
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-24 h-24 object-cover rounded-xl bg-black border border-white/10 shrink-0"
                          />
                          <div className="space-y-1 overflow-hidden">
                            <span className="text-[11px] font-mono text-[#00D084] bg-[#00D084]/15 px-2 py-0.5 rounded">
                              {course.category}
                            </span>
                            <h4 className="text-base font-bold text-white truncate">{course.title}</h4>
                            <p className="text-xs text-[#A5B0AA] line-clamp-2">{course.shortDesc}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] text-xs font-mono space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#A5B0AA]">Access Mode:</span>
                            <span className="text-white">{course.accessMode}</span>
                          </div>
                          <div className="flex justify-between truncate">
                            <span className="text-[#A5B0AA]">Secret Join Link:</span>
                            <span className="text-[#00D084] truncate max-w-[200px]">{course.joinUrl}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#A5B0AA]">Status:</span>
                            <span className={course.published ? 'text-[#00D084]' : 'text-neutral-500'}>
                              {course.published ? 'Published' : 'Draft / Hidden'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.06]">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="px-3 py-1.5 text-xs text-white bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Course</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmState({
                                isOpen: true,
                                title: `Delete Course "${course.title}"?`,
                                message: `Are you sure you want to permanently delete course "${course.title}"?`,
                                confirmButtonText: 'Yes, Delete Course',
                                onConfirm: async () => {
                                  await deleteCourse(course.id);
                                  setCourses(prev => prev.filter(c => c.id !== course.id));
                                  await loadAllAdminData();
                                  notifySaved(`Deleted ${course.title}`);
                                }
                              });
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SOCIAL & CUSTOM LINKS MANAGER */}
              {activeTab === 'links' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Social Media & Custom Links Manager</h3>
                      <p className="text-xs text-[#A5B0AA]">
                        Manage unlimited social media channels, community portals, partner registration links, and custom destinations.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingLink({
                          title: '',
                          category: 'Telegram Channel',
                          url: 'https://t.me/tradewithjahid',
                          description: 'Join for live market insights.',
                          iconName: 'Send',
                          buttonLabel: 'Open Channel',
                          displayLocations: ['social_section', 'footer'],
                          order: links.length + 1,
                          isActive: true,
                          isFeatured: false,
                          openInNewTab: true
                        })
                      }
                      className="px-4 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Link</span>
                    </button>
                  </div>

                  {/* Links Table */}
                  <div className="bg-[#111715] rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-xs text-[#A5B0AA]">
                      <thead className="bg-[#0e1412] text-white/90 border-b border-white/[0.08] font-mono uppercase text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Title & Description</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">URL</th>
                          <th className="py-3 px-4">Placements</th>
                          <th className="py-3 px-4">Clicks</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {links.map(link => (
                          <tr key={link.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <span className="font-bold text-white block">{link.title}</span>
                              <span className="text-[11px] text-neutral-400">{link.description}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#D4AF37]">{link.category}</td>
                            <td className="py-3 px-4 max-w-xs truncate font-mono text-[#00D084]">
                              <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                                {link.url}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              {link.displayLocations?.join(', ')}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                              {link.clickCount || 0}
                            </td>
                            <td className="py-3 px-4">
                              <span className={link.isActive ? 'text-[#00D084]' : 'text-neutral-500'}>
                                {link.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1 shrink-0">
                              <button
                                onClick={() => setEditingLink(link)}
                                className="p-1 text-[#A5B0AA] hover:text-white rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmState({
                                    isOpen: true,
                                    title: `Delete Link "${link.title}"?`,
                                    message: `Are you sure you want to permanently delete link "${link.title}"?`,
                                    confirmButtonText: 'Yes, Delete Link',
                                    onConfirm: async () => {
                                  await deleteLink(link.id);
                                      setLinks(prev => prev.filter(l => l.id !== link.id));
                                      await loadAllAdminData();
                                      notifySaved(`Deleted ${link.title}`);
                                    }
                                  });
                                }}
                                className="p-1 text-neutral-600 hover:text-red-400 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: PORTFOLIO TRADES */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Trade Portfolio & Case Studies</h3>
                      <p className="text-xs text-[#A5B0AA]">
                        Publish verified trade breakdowns, risk-to-reward metrics, and institutional setups.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingPortfolio({
                          title: 'New Trade Case Study',
                          instrument: 'Forex',
                          pair: 'EUR/USD',
                          outcome: 'WIN',
                          riskReward: '1:3.5 RR',
                          profitPercentage: '+3.5%',
                          screenshotUrl: '/images/forex_course_cover_1791906599347.jpg',
                          date: 'October 2026',
                          educationalNote: 'Clean FVG mitigation with 8 pip stop loss.',
                          published: true,
                          order: portfolio.length + 1
                        })
                      }
                      className="px-4 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Trade Breakdown</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolio.map(item => (
                      <div
                        key={item.id}
                        className="bg-[#111715] rounded-2xl border border-white/10 p-5 space-y-3 flex flex-col justify-between"
                      >
                        <div className="flex gap-4">
                          <img
                            src={item.screenshotUrl}
                            alt={item.title}
                            className="w-24 h-20 object-cover rounded-xl bg-black border border-white/10 shrink-0"
                          />
                          <div className="space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D084]/20 text-[#00D084]">
                                {item.pair}
                              </span>
                              <span className="text-[10px] font-mono text-[#D4AF37]">{item.riskReward}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                            <p className="text-xs text-[#A5B0AA] line-clamp-2">{item.educationalNote}</p>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-white/[0.06] text-xs">
                          <span className="font-mono text-[#00D084] font-bold">{item.profitPercentage}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingPortfolio(item)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmState({
                                  isOpen: true,
                                  title: `Delete Trade "${item.title}"?`,
                                  message: `Are you sure you want to permanently delete trade "${item.title}"?`,
                                  confirmButtonText: 'Yes, Delete Trade',
                                  onConfirm: async () => {
                                    await deletePortfolioItem(item.id);
                                    setPortfolio(prev => prev.filter(p => p.id !== item.id));
                                    await loadAllAdminData();
                                    notifySaved('Deleted trade');
                                  }
                                });
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TRADING BOOKS (PDFS) */}
              {activeTab === 'books' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Trading Books (PDFs) Management</h3>
                      <p className="text-xs text-[#A5B0AA] mt-1">
                        Upload and manage masterclass PDF books available on the public website.
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingBook({
                        title: '',
                        author: 'Jahid Hossain',
                        description: '',
                        pdfUrl: '',
                        coverImage: '/images/binary_course_cover_1791906598444.jpg',
                        published: true,
                        order: books.length + 1
                      })}
                      className="px-4 py-2.5 bg-[#00D084] text-black text-xs font-bold rounded-xl flex items-center gap-2 shadow hover:bg-[#00e692] cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New PDF Book</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map(book => (
                      <div key={book.id} className="bg-[#111715] p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between shadow-xl">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D084]/20 text-[#00D084]">
                              PDF Book
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${book.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {book.published ? 'Published' : 'Hidden'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <img src={book.coverImage} alt={book.title} className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate">{book.title}</h4>
                              <span className="text-xs text-[#00D084] truncate block">Author: {book.author}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#A5B0AA] line-clamp-2">{book.description}</p>
                        </div>

                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                          <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[#00D084] hover:underline font-mono text-[11px] truncate max-w-[160px]">
                            {book.pdfUrl || 'No PDF assigned'}
                          </a>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingBook(book)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmState({
                                  isOpen: true,
                                  title: `Delete Book "${book.title}"?`,
                                  message: `Are you sure you want to permanently delete this book?`,
                                  confirmButtonText: 'Yes, Delete Book',
                                  onConfirm: async () => {
                                    await deleteBook(book.id);
                                    setBooks(prev => prev.filter(b => b.id !== book.id));
                                    await loadAllAdminData();
                                    notifySaved('Deleted book');
                                  }
                                });
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: STRATEGIES (PICTURES) */}
              {activeTab === 'strategies' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Strategy Pictures Management</h3>
                      <p className="text-xs text-[#A5B0AA] mt-1">
                        Upload and manage institutional trading strategy pictures and charts.
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingStrategy({
                        title: '',
                        category: 'Institutional Strategy',
                        description: '',
                        imageUrl: '/images/hero_trading_terminal_1791906597313.jpg',
                        winRate: '85% Win Rate',
                        published: true,
                        order: strategies.length + 1
                      })}
                      className="px-4 py-2.5 bg-[#00D084] text-black text-xs font-bold rounded-xl flex items-center gap-2 shadow hover:bg-[#00e692] cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Strategy Picture</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.map(strat => (
                      <div key={strat.id} className="bg-[#111715] p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between shadow-xl">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                              {strat.category}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${strat.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {strat.published ? 'Published' : 'Hidden'}
                            </span>
                          </div>
                          <div className="relative h-36 rounded-xl overflow-hidden border border-white/10">
                            <img src={strat.imageUrl} alt={strat.title} className="w-full h-full object-cover" />
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{strat.title}</h4>
                          <p className="text-xs text-[#A5B0AA] line-clamp-2">{strat.description}</p>
                        </div>

                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                          <span className="font-mono text-[#D4AF37] font-bold">{strat.winRate}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingStrategy(strat)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmState({
                                  isOpen: true,
                                  title: `Delete Strategy "${strat.title}"?`,
                                  message: `Are you sure you want to permanently delete this strategy?`,
                                  confirmButtonText: 'Yes, Delete Strategy',
                                  onConfirm: async () => {
                                    await deleteStrategy(strat.id);
                                    setStrategies(prev => prev.filter(s => s.id !== strat.id));
                                    await loadAllAdminData();
                                    notifySaved('Deleted strategy');
                                  }
                                });
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: 3D VISUAL EFFECTS & ANIMATION SETTINGS */}
              {activeTab === 'animations' && (
                <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Visual Effects & Animation Settings</h3>
                    <p className="text-xs text-[#A5B0AA]">
                      Control Three.js 3D candlestick charts, particle intensity, scroll speed, and mobile responsiveness.
                    </p>
                  </div>

                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      await updateAnimationSettings(animationsForm);
                      notifySaved('Visual effects settings saved & updated on live website');
                    }}
                    className="space-y-6 bg-[#111715] p-6 sm:p-8 rounded-2xl border border-white/10"
                  >
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Global Effect Toggles
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.06] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={animationsForm.enable3D !== false}
                            onChange={e => setAnimationsForm({ ...animationsForm, enable3D: e.target.checked })}
                            className="w-4 h-4 accent-[#00D084]"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Enable 3D Background</span>
                            <span className="text-[10px] text-[#A5B0AA]">Three.js WebGL candlestick world</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.06] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={animationsForm.enableParticles !== false}
                            onChange={e => setAnimationsForm({ ...animationsForm, enableParticles: e.target.checked })}
                            className="w-4 h-4 accent-[#00D084]"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Floating Emerald Particles</span>
                            <span className="text-[10px] text-[#A5B0AA]">Ambient floating particles</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.06] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={animationsForm.enableCursor !== false}
                            onChange={e => setAnimationsForm({ ...animationsForm, enableCursor: e.target.checked })}
                            className="w-4 h-4 accent-[#00D084]"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Mouse Parallax Depth</span>
                            <span className="text-[10px] text-[#A5B0AA]">Camera responds to cursor</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.06] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={animationsForm.enableOnMobile === true}
                            onChange={e => setAnimationsForm({ ...animationsForm, enableOnMobile: e.target.checked })}
                            className="w-4 h-4 accent-[#00D084]"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Enable 3D On Mobile</span>
                            <span className="text-[10px] text-[#A5B0AA]">Disable for best battery/smoothness</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Intensity & Dynamics
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-white/90 block mb-1">Animation Intensity</label>
                          <select
                            value={animationsForm.intensity || 'medium'}
                            onChange={e => setAnimationsForm({ ...animationsForm, intensity: e.target.value as any })}
                            className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                          >
                            <option value="low">Low (Subtle)</option>
                            <option value="medium">Medium (Standard)</option>
                            <option value="high">High (Dynamic)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-white/90 block mb-1">
                            Motion Speed: {animationsForm.speed || 1.0}x
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={animationsForm.speed || 1.0}
                            onChange={e => setAnimationsForm({ ...animationsForm, speed: parseFloat(e.target.value) })}
                            className="w-full accent-[#00D084]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-white/90 block mb-1">
                            Particle Count: {animationsForm.particleDensity || 75}
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="150"
                            step="5"
                            value={animationsForm.particleDensity || 75}
                            onChange={e => setAnimationsForm({ ...animationsForm, particleDensity: parseInt(e.target.value) })}
                            className="w-full accent-[#00D084]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-white/90 block mb-1">Background Atmosphere Style</label>
                        <select
                          value={animationsForm.backgroundStyle || 'emerald_mesh'}
                          onChange={e => setAnimationsForm({ ...animationsForm, backgroundStyle: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                        >
                          <option value="emerald_mesh">Emerald Nebula & Deep Glow</option>
                          <option value="matte_obsidian">Matte Obsidian (#080B0A Pure Dark)</option>
                          <option value="cyber_grid">Cybernetic Grid & Horizon</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-xs font-bold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save & Apply Visual Effects</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 7: WEBSITE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Website Brand & Content Settings</h3>
                    <p className="text-xs text-[#A5B0AA]">
                      Modify brand title, taglines, Telegram links, profile avatar URL, and disclaimers.
                    </p>
                  </div>

                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      await updateWebsiteSettings(settingsForm);
                      notifySaved('Website brand settings updated successfully');
                    }}
                    className="space-y-5 bg-[#111715] p-6 sm:p-8 rounded-2xl border border-white/10"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Brand Name</label>
                        <input
                          type="text"
                          value={settingsForm.brandName || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Tagline</label>
                        <input
                          type="text"
                          value={settingsForm.tagline || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* SECTION 1: HOMEPAGE HERO HEADLINE (ছবি ১: Master The Markets With Professional Precision) */}
                    <div className="p-5 rounded-2xl bg-[#0e1412] border border-yellow-500/30 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div>
                          <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                            <span>1. Homepage Hero Headline (হোমপেজ মেইন টাইটেল)</span>
                          </h4>
                          <p className="text-[11px] text-[#A5B0AA]">
                            ছবি ১ অনুযায়ী সাদা ও গোল্ডেন রঙের লেখা আলাদাভাবে পরিবর্তন করুন:
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          ছবি ১
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-white block mb-1">
                            Primary Text (সাদা লেখা)
                          </label>
                          <input
                            type="text"
                            placeholder="Master The Markets With"
                            value={settingsForm.heroTitlePrimary !== undefined ? settingsForm.heroTitlePrimary : (settingsForm.heroTitle || 'Master The Markets With')}
                            onChange={e => setSettingsForm({ ...settingsForm, heroTitlePrimary: e.target.value })}
                            className="w-full px-3 py-2.5 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-yellow-400 block mb-1">
                            Highlight Text (গোল্ডেন লেখা)
                          </label>
                          <input
                            type="text"
                            placeholder="Professional Precision"
                            value={settingsForm.heroTitleHighlight !== undefined ? settingsForm.heroTitleHighlight : 'Professional Precision'}
                            onChange={e => setSettingsForm({ ...settingsForm, heroTitleHighlight: e.target.value })}
                            className="w-full px-3 py-2.5 bg-black border border-yellow-500/40 rounded-xl text-xs text-yellow-300 font-semibold focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Hero Subtitle (সাবটাইটেল)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubtitle || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                          placeholder="Join thousands of profitable traders utilizing advanced Price Action, automated algorithms, and Jahid’s proven institutional setups."
                          className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      {/* Live Visual Preview for Hero Title */}
                      <div className="p-4 bg-black/80 rounded-xl border border-yellow-500/30 text-left">
                        <span className="text-[10px] uppercase font-mono text-yellow-500/80 block mb-1">
                          Live Preview (ওয়েবসাইটে যেমন দেখাবে):
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {settingsForm.heroTitlePrimary !== undefined ? settingsForm.heroTitlePrimary : 'Master The Markets With'}{' '}
                          <span className="text-yellow-400 font-black">
                            {settingsForm.heroTitleHighlight !== undefined ? settingsForm.heroTitleHighlight : 'Professional Precision'}
                          </span>
                        </h1>
                      </div>
                    </div>

                    {/* SECTION 2: COURSES & SIGNALS HEADLINE (ছবি ২: Comprehensive Courses, Algorithmic Bots & Signals) */}
                    <div className="p-5 rounded-2xl bg-[#0e1412] border border-yellow-500/30 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div>
                          <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                            <span>2. Courses Section Headline (কোর্স সেকশন টাইটেল)</span>
                          </h4>
                          <p className="text-[11px] text-[#A5B0AA]">
                            ছবি ২ অনুযায়ী কোর্স সেকশনের সাদা ও গোল্ডেন লেখা আলাদাভাবে পরিবর্তন করুন:
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          ছবি ২
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-white block mb-1">
                            Primary Text (সাদা লেখা)
                          </label>
                          <input
                            type="text"
                            placeholder="Comprehensive Courses,"
                            value={settingsForm.coursesTitlePrimary !== undefined ? settingsForm.coursesTitlePrimary : 'Comprehensive Courses,'}
                            onChange={e => setSettingsForm({ ...settingsForm, coursesTitlePrimary: e.target.value })}
                            className="w-full px-3 py-2.5 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-yellow-400 block mb-1">
                            Highlight Text (গোল্ডেন লেখা)
                          </label>
                          <input
                            type="text"
                            placeholder="Algorithmic Bots & Signals"
                            value={settingsForm.coursesTitleHighlight !== undefined ? settingsForm.coursesTitleHighlight : 'Algorithmic Bots & Signals'}
                            onChange={e => setSettingsForm({ ...settingsForm, coursesTitleHighlight: e.target.value })}
                            className="w-full px-3 py-2.5 bg-black border border-yellow-500/40 rounded-xl text-xs text-yellow-300 font-semibold focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Courses Subtitle (কোর্স সাবটাইটেল)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.coursesSubtitle || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, coursesSubtitle: e.target.value })}
                          placeholder="Eliminate guesswork with institutional methodologies. Select a course or service below to review the curriculum and initiate verified access."
                          className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      {/* Live Visual Preview for Courses Title */}
                      <div className="p-4 bg-black/80 rounded-xl border border-yellow-500/30 text-left">
                        <span className="text-[10px] uppercase font-mono text-yellow-500/80 block mb-1">
                          Live Preview (ওয়েবসাইটে যেমন দেখাবে):
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {settingsForm.coursesTitlePrimary !== undefined ? settingsForm.coursesTitlePrimary : 'Comprehensive Courses,'}{' '}
                          <span className="text-yellow-400 font-black">
                            {settingsForm.coursesTitleHighlight !== undefined ? settingsForm.coursesTitleHighlight : 'Algorithmic Bots & Signals'}
                          </span>
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Official Telegram Community URL</label>
                        <input
                          type="text"
                          value={settingsForm.telegramCommunityUrl || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, telegramCommunityUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/90 block mb-1">Telegram Admin Contact URL</label>
                        <input
                          type="text"
                          value={settingsForm.telegramAdminUrl || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, telegramAdminUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/[0.06]">
                      <ImageUploadWidget
                        label="Official Logo Image (Upload from Device / Gallery)"
                        value={settingsForm.logoUrl || ''}
                        onChange={url => setSettingsForm({ ...settingsForm, logoUrl: url })}
                        aspectHint="Circular crest / emblem (PNG, JPG, WEBP)"
                      />

                      <ImageUploadWidget
                        label="Jahid Profile Photo (Upload from Device / Gallery)"
                        value={settingsForm.profileImageUrl || ''}
                        onChange={url => setSettingsForm({ ...settingsForm, profileImageUrl: url })}
                        aspectHint="Portrait or square mentor photo from phone or PC"
                      />
                    </div>

                    <div className="pt-2">
                      <ImageUploadWidget
                        label="Hero Trading Background Banner (Upload from Device)"
                        value={settingsForm.heroBannerUrl || ''}
                        onChange={url => setSettingsForm({ ...settingsForm, heroBannerUrl: url })}
                        aspectHint="Wide 16:9 banner image"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/90 block mb-1">About Jahid Bio</label>
                      <textarea
                        rows={3}
                        value={settingsForm.aboutBio || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, aboutBio: e.target.value })}
                        className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/90 block mb-1">Mandatory Risk Notice Text</label>
                      <textarea
                        rows={3}
                        value={settingsForm.riskNotice || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, riskNotice: e.target.value })}
                        className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white text-[11px]"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-xs font-bold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save All Settings</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 8: SECURITY & AUDIT LOGS */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Security & Audit Logs</h3>
                    <p className="text-xs text-[#A5B0AA]">
                      Change administrator password and inspect immutable system audit events.
                    </p>
                  </div>

                  {/* Password Change Box */}
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      setPasswordMsg({ type: '', text: '' });
                      try {
                        await changeAdminPassword(currPassword, newPassword);
                        setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
                        setCurrPassword('');
                        setNewPassword('');
                      } catch (err: any) {
                        setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
                      }
                    }}
                    className="p-6 bg-[#111715] rounded-2xl border border-white/10 space-y-4"
                  >
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#D4AF37]" />
                      <span>Change Administrator Password</span>
                    </h4>

                    {passwordMsg.text && (
                      <div
                        className={`p-3 rounded-xl text-xs ${
                          passwordMsg.type === 'success'
                            ? 'bg-[#00D084]/15 border border-[#00D084]/30 text-[#00D084]'
                            : 'bg-red-950/40 border border-red-500/40 text-red-300'
                        }`}
                      >
                        {passwordMsg.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-white/90 block mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currPassword}
                          onChange={e => setCurrPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-white/90 block mb-1">New Password (min 6 chars)</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl cursor-pointer"
                      >
                        Update Master Password
                      </button>
                    </div>
                  </form>

                  {/* Audit Logs List */}
                  <div className="p-6 bg-[#111715] rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#00D084]" />
                        <span>Recent Administrative Action Logs ({auditLogs.length})</span>
                      </h4>

                      {auditLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              title: 'Clear All Audit Logs?',
                              message: 'Are you sure you want to delete all audit action logs? This action cannot be undone.',
                              confirmButtonText: 'Yes, Clear Logs',
                              onConfirm: async () => {
                                await clearAuditLogs();
                                setAuditLogs([]);
                                notifySaved('All audit action logs cleared');
                              }
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors cursor-pointer border border-red-500/20 flex items-center gap-1"
                          title="Clear all logs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Logs</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs text-[#A5B0AA]">
                      {auditLogs.map(log => (
                        <div
                          key={log.id}
                          className="p-2.5 bg-black/40 rounded-lg border border-white/[0.04] flex items-start justify-between gap-3"
                        >
                          <div>
                            <span className="text-white font-bold block">{log.action}</span>
                            <span className="text-[11px] text-neutral-400">{log.details}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: MEDIA & DEVICE UPLOADS */}
              {activeTab === 'media' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Device Media & Picture Manager</h3>
                      <p className="text-xs text-[#A5B0AA]">
                        Upload logos, profile photos, course thumbnails, and screenshots directly from your phone or computer.
                      </p>
                    </div>
                  </div>

                  {/* Direct Device Upload Box */}
                  <div className="bg-[#111715] p-6 rounded-2xl border border-white/10 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-[#00D084]" />
                      <span>Upload New Picture From Device</span>
                    </h4>

                    <ImageUploadWidget
                      label="Select or Drag Image from Phone / Computer"
                      value=""
                      onChange={async () => {
                        const media = await fetchMediaLibrary().catch(() => []);
                        setMediaLibrary(media);
                        notifySaved('Image uploaded to device library');
                      }}
                      aspectHint="Supports PNG, JPG, JPEG, WEBP, GIF (up to 25MB)"
                    />
                  </div>

                  {/* Media Library Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Uploaded Pictures On Server ({mediaLibrary.length})
                      </h4>
                      <button
                        onClick={async () => {
                          const media = await fetchMediaLibrary().catch(() => []);
                          setMediaLibrary(media);
                        }}
                        className="text-xs text-[#00D084] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh Media</span>
                      </button>
                    </div>

                    {mediaLibrary.length === 0 ? (
                      <div className="p-8 text-center bg-[#111715] rounded-2xl border border-white/10 text-xs text-[#A5B0AA]">
                        <ImageIcon className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                        <p>No device photos uploaded yet.</p>
                        <p className="text-[11px] text-neutral-500 mt-1">Use the upload box above to add pictures directly from your phone or computer.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaLibrary.map(item => (
                          <div
                            key={item.fileName}
                            className="bg-[#111715] rounded-xl border border-white/10 overflow-hidden flex flex-col justify-between group"
                          >
                            <div className="relative aspect-video w-full bg-black overflow-hidden">
                              <img
                                src={item.url}
                                alt={item.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-white border border-white/10">
                                {item.sizeKb} KB
                              </span>
                            </div>

                            <div className="p-3 space-y-2 text-left">
                              <span className="text-xs font-medium text-white truncate block font-mono" title={item.fileName}>
                                {item.fileName}
                              </span>

                              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-1.5 text-[11px]">
                                <button
                                  onClick={async () => {
                                    await updateWebsiteSettings({ logoUrl: item.url });
                                    setSettingsForm(prev => ({ ...prev, logoUrl: item.url }));
                                    notifySaved('Set as official website logo');
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-[#00D084] hover:text-black text-white rounded transition-colors cursor-pointer"
                                >
                                  Set as Logo
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateWebsiteSettings({ profileImageUrl: item.url });
                                    setSettingsForm(prev => ({ ...prev, profileImageUrl: item.url }));
                                    notifySaved('Set as mentor profile photo');
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-[#00D084] hover:text-black text-white rounded transition-colors cursor-pointer"
                                >
                                  Set as Profile
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateWebsiteSettings({ heroBannerUrl: item.url });
                                    setSettingsForm(prev => ({ ...prev, heroBannerUrl: item.url }));
                                    notifySaved('Set as hero background banner');
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-[#00D084] hover:text-black text-white rounded transition-colors cursor-pointer"
                                >
                                  Set as Banner
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.url);
                                    notifySaved('Copied image URL to clipboard');
                                  }}
                                  className="p-1 bg-white/5 hover:bg-white/15 text-[#A5B0AA] hover:text-white rounded cursor-pointer"
                                  title="Copy URL"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Permanently delete picture "${item.fileName}" from device storage?`)) {
                                      try {
                                        await deleteMediaFile(item.fileName);
                                        const updated = await fetchMediaLibrary().catch(() => []);
                                        setMediaLibrary(updated);
                                        notifySaved(`Deleted picture: ${item.fileName}`);
                                      } catch (err: any) {
                                        alert(err.message || 'Failed to delete file');
                                      }
                                    }
                                  }}
                                  className="p-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded ml-auto transition-colors cursor-pointer"
                                  title="Delete picture from device library"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>

          {/* Mobile Bottom Navigation Bar (Thumb-friendly Mobile App Experience) */}
          <nav className="md:hidden bg-[#090f0d] border-t border-yellow-500/20 px-2 py-2 flex items-center justify-around shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview' ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Overview</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('submissions'); setMobileSidebarOpen(false); }}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'submissions' ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Users className="w-4 h-4 mb-0.5" />
                {submissions.filter(s => s.status === 'Pending Review').length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                    {submissions.filter(s => s.status === 'Pending Review').length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Requests</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('courses'); setMobileSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'courses' ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Courses</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('books'); setMobileSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'books' || activeTab === 'strategies' ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Books</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings' ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-yellow-500/80 hover:text-yellow-400 transition-all cursor-pointer"
            >
              <Menu className="w-4 h-4 mb-0.5 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-semibold">More</span>
            </button>
          </nav>
        </div>
      )}
    </div>

      {/* Course Edit/Create Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCourse.id ? 'Edit Course / Service' : 'Add New Course / Service'}
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-[#A5B0AA] hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingCourse.id) {
                  await updateCourse(editingCourse.id, editingCourse);
                  notifySaved(`Updated course`);
                } else {
                  await createCourse(editingCourse);
                  notifySaved(`Created course`);
                }
                setEditingCourse(null);
                loadAllAdminData();
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Title</label>
                  <input
                    type="text"
                    value={editingCourse.title || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white/90 block mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingCourse.slug || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, slug: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Category</label>
                  <select
                    value={editingCourse.category || 'Binary Trading Course'}
                    onChange={e => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  >
                    <option value="Binary Trading Course">Binary Trading Course</option>
                    <option value="Forex Trading Course">Forex Trading Course</option>
                    <option value="Trading Signals">Trading Signals</option>
                    <option value="Trading Bots">Trading Bots</option>
                    <option value="Live Trading Classes">Live Trading Classes</option>
                    <option value="Trading Community">Trading Community</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Access Mode</label>
                  <select
                    value={editingCourse.accessMode || 'new_account'}
                    onChange={e => setEditingCourse({ ...editingCourse, accessMode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  >
                    <option value="new_account">Mode A — New Account Required</option>
                    <option value="existing_id">Mode B — Existing Account ID Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-white/90 block mb-1">Partner Registration URL</label>
                <input
                  type="text"
                  value={editingCourse.registrationUrl || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, registrationUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-white/90 block mb-1">
                  Secret VIP JOIN URL (Unlocked only upon approval)
                </label>
                <input
                  type="text"
                  value={editingCourse.joinUrl || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, joinUrl: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-[#00D084]/40 rounded-xl text-[#00D084] font-mono"
                />
              </div>

              <ImageUploadWidget
                label="Course Cover Image (Upload from Device / Gallery)"
                value={editingCourse.coverImage || ''}
                onChange={url => setEditingCourse({ ...editingCourse, coverImage: url })}
                aspectHint="Course thumbnail (16:10 or 16:9 ratio recommended)"
              />

              <div>
                <label className="font-semibold text-white/90 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingCourse.shortDesc || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-white/90 block mb-1">Curriculum Modules (comma-separated)</label>
                <textarea
                  rows={2}
                  value={editingCourse.modules?.join(', ') || ''}
                  onChange={e =>
                    setEditingCourse({
                      ...editingCourse,
                      modules: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                    })
                  }
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-xs text-[#A5B0AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Edit/Create Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingLink.id ? 'Edit Social / Custom Link' : 'Add New Link'}
              </h3>
              <button onClick={() => setEditingLink(null)} className="text-[#A5B0AA] hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingLink.id) {
                  await updateLink(editingLink.id, editingLink);
                  notifySaved(`Updated link`);
                } else {
                  await createLink(editingLink);
                  notifySaved(`Created link`);
                }
                setEditingLink(null);
                loadAllAdminData();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-white block mb-1">Title</label>
                <input
                  type="text"
                  value={editingLink.title || ''}
                  onChange={e => setEditingLink({ ...editingLink, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white block mb-1">Category</label>
                  <select
                    value={editingLink.category || 'Telegram Group'}
                    onChange={e => setEditingLink({ ...editingLink, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  >
                    <option value="Telegram Group">Telegram Group</option>
                    <option value="Telegram Admin / Direct Contact">Telegram Admin / Direct Contact</option>
                    <option value="YouTube Channel">YouTube Channel</option>
                    <option value="Facebook Page">Facebook Page</option>
                    <option value="WhatsApp Direct Contact">WhatsApp Direct Contact</option>
                    <option value="Discord Server">Discord Server</option>
                    <option value="Instagram Profile">Instagram Profile</option>
                    <option value="Registration Link">Registration Link</option>
                    <option value="Custom Link">Custom Link</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-white block mb-1">Button Label</label>
                  <input
                    type="text"
                    value={editingLink.buttonLabel || 'Open Link'}
                    onChange={e => setEditingLink({ ...editingLink, buttonLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">URL</label>
                <input
                  type="url"
                  value={editingLink.url || ''}
                  onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">Description</label>
                <input
                  type="text"
                  value={editingLink.description || ''}
                  onChange={e => setEditingLink({ ...editingLink, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLink.isActive !== false}
                    onChange={e => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                    className="accent-[#00D084]"
                  />
                  <span className="text-white">Active Link</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLink.openInNewTab !== false}
                    onChange={e => setEditingLink({ ...editingLink, openInNewTab: e.target.checked })}
                    className="accent-[#00D084]"
                  />
                  <span className="text-white">Open in New Tab</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-xs text-[#A5B0AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio Edit Modal */}
      {editingPortfolio && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPortfolio.id ? 'Edit Trade Breakdown' : 'Add Trade Breakdown'}
              </h3>
              <button onClick={() => setEditingPortfolio(null)} className="text-[#A5B0AA] hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingPortfolio.id) {
                  await updatePortfolioItem(editingPortfolio.id, editingPortfolio);
                  notifySaved(`Updated trade breakdown`);
                } else {
                  await createPortfolioItem(editingPortfolio);
                  notifySaved(`Created trade breakdown`);
                }
                setEditingPortfolio(null);
                loadAllAdminData();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-white block mb-1">Trade Title</label>
                <input
                  type="text"
                  value={editingPortfolio.title || ''}
                  onChange={e => setEditingPortfolio({ ...editingPortfolio, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-white block mb-1">Instrument</label>
                  <select
                    value={editingPortfolio.instrument || 'Forex'}
                    onChange={e => setEditingPortfolio({ ...editingPortfolio, instrument: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  >
                    <option value="Forex">Forex</option>
                    <option value="Binary">Binary</option>
                    <option value="Bot">Bot</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-white block mb-1">Pair / Asset</label>
                  <input
                    type="text"
                    value={editingPortfolio.pair || ''}
                    onChange={e => setEditingPortfolio({ ...editingPortfolio, pair: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-white block mb-1">Profit % / Outcome</label>
                  <input
                    type="text"
                    value={editingPortfolio.profitPercentage || '+4.0%'}
                    onChange={e => setEditingPortfolio({ ...editingPortfolio, profitPercentage: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono text-[#00D084]"
                  />
                </div>
              </div>

              <ImageUploadWidget
                label="Trade Screenshot / Chart Image (Upload from Device / Gallery)"
                value={editingPortfolio.screenshotUrl || ''}
                onChange={url => setEditingPortfolio({ ...editingPortfolio, screenshotUrl: url })}
                aspectHint="Upload trade screenshot or TradingView chart from device"
              />

              <div>
                <label className="font-semibold text-white block mb-1">Tactical Analysis & Notes</label>
                <textarea
                  rows={3}
                  value={editingPortfolio.educationalNote || ''}
                  onChange={e => setEditingPortfolio({ ...editingPortfolio, educationalNote: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPortfolio(null)}
                  className="px-4 py-2 text-xs text-[#A5B0AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl"
                >
                  Save Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Notes Modal */}
      {reviewingSub && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Review Submission {reviewingSub.id}</h3>
              <button onClick={() => setReviewingSub(null)} className="text-[#A5B0AA] hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#A5B0AA] block">Account ID:</span>
                <span className="text-white font-mono font-bold">{reviewingSub.accountId}</span>
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">Status</label>
                <select
                  value={reviewingSub.status}
                  onChange={e => setReviewingSub({ ...reviewingSub, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">Review Notes (Visible to User)</label>
                <textarea
                  rows={3}
                  value={reviewingSub.reviewNotes || ''}
                  onChange={e => setReviewingSub({ ...reviewingSub, reviewNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReviewingSub(null)}
                  className="px-4 py-2 text-xs text-[#A5B0AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateSubmission(reviewingSub.id, {
                      status: reviewingSub.status,
                      reviewNotes: reviewingSub.reviewNotes
                    });
                    setReviewingSub(null);
                    loadAllAdminData();
                    notifySaved(`Updated submission ${reviewingSub.id}`);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] rounded-xl"
                >
                  Update Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Edit/Create Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBook.id ? 'Edit Trading Book' : 'Add New Trading Book (PDF)'}
              </h3>
              <button onClick={() => setEditingBook(null)} className="text-[#A5B0AA] hover:text-white">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingBook.id) {
                  await updateBook(editingBook.id, editingBook);
                  notifySaved('Updated book');
                } else {
                  await createBook(editingBook);
                  notifySaved('Created book');
                }
                setEditingBook(null);
                loadAllAdminData();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-white/90 block mb-1">Book Title</label>
                <input
                  type="text"
                  value={editingBook.title || ''}
                  onChange={e => setEditingBook({ ...editingBook, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Author</label>
                  <input
                    type="text"
                    value={editingBook.author || 'Jahid Hossain'}
                    onChange={e => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingBook.order || 1}
                    onChange={e => setEditingBook({ ...editingBook, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white/90 block mb-1">PDF File URL (or upload below)</label>
                <input
                  type="text"
                  value={editingBook.pdfUrl || ''}
                  onChange={e => setEditingBook({ ...editingBook, pdfUrl: e.target.value })}
                  placeholder="/uploads/my_book.pdf"
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-white/90 block mb-1">Upload PDF File from Device</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const res = await uploadImage(file as any);
                        setEditingBook({ ...editingBook, pdfUrl: res.url });
                        notifySaved('PDF file uploaded successfully');
                      } catch (err: any) {
                        alert(err.message || 'Failed to upload PDF');
                      }
                    }
                  }}
                  className="w-full text-xs text-[#A5B0AA] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#00D084] file:text-black hover:file:bg-[#00e692] cursor-pointer"
                />
              </div>

              <ImageUploadWidget
                label="Book Cover Image"
                value={editingBook.coverImage || ''}
                onChange={url => setEditingBook({ ...editingBook, coverImage: url })}
                aspectHint="Cover image (portrait ratio recommended)"
              />

              <div>
                <label className="font-semibold text-white/90 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingBook.description || ''}
                  onChange={e => setEditingBook({ ...editingBook, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bookPublished"
                  checked={editingBook.published !== false}
                  onChange={e => setEditingBook({ ...editingBook, published: e.target.checked })}
                  className="w-4 h-4 accent-[#00D084]"
                />
                <label htmlFor="bookPublished" className="text-white font-medium cursor-pointer">Published on Public Website</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingBook(null)} className="px-4 py-2 bg-white/5 text-white rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#00D084] text-black font-bold rounded-xl">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Strategy Edit/Create Modal */}
      {editingStrategy && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#111715] border border-white/10 rounded-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingStrategy.id ? 'Edit Strategy Picture' : 'Add New Strategy Picture'}
              </h3>
              <button onClick={() => setEditingStrategy(null)} className="text-[#A5B0AA] hover:text-white">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (editingStrategy.id) {
                  await updateStrategy(editingStrategy.id, editingStrategy);
                  notifySaved('Updated strategy');
                } else {
                  await createStrategy(editingStrategy);
                  notifySaved('Created strategy');
                }
                setEditingStrategy(null);
                loadAllAdminData();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-white/90 block mb-1">Strategy Title</label>
                <input
                  type="text"
                  value={editingStrategy.title || ''}
                  onChange={e => setEditingStrategy({ ...editingStrategy, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Category / Market</label>
                  <input
                    type="text"
                    value={editingStrategy.category || ''}
                    onChange={e => setEditingStrategy({ ...editingStrategy, category: e.target.value })}
                    placeholder="Forex / Binary / SMC"
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white/90 block mb-1">Win Rate / Accuracy</label>
                  <input
                    type="text"
                    value={editingStrategy.winRate || ''}
                    onChange={e => setEditingStrategy({ ...editingStrategy, winRate: e.target.value })}
                    placeholder="85% Win Rate"
                    className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <ImageUploadWidget
                label="Strategy Picture / Chart"
                value={editingStrategy.imageUrl || ''}
                onChange={url => setEditingStrategy({ ...editingStrategy, imageUrl: url })}
                aspectHint="Strategy chart screenshot (16:9 ratio recommended)"
              />

              <div>
                <label className="font-semibold text-white/90 block mb-1">Strategy Execution Note / Description</label>
                <textarea
                  rows={3}
                  value={editingStrategy.description || ''}
                  onChange={e => setEditingStrategy({ ...editingStrategy, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#080B0A] border border-white/10 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stratPublished"
                  checked={editingStrategy.published !== false}
                  onChange={e => setEditingStrategy({ ...editingStrategy, published: e.target.checked })}
                  className="w-4 h-4 accent-[#00D084]"
                />
                <label htmlFor="stratPublished" className="text-white font-medium cursor-pointer">Published on Public Website</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingStrategy(null)} className="px-4 py-2 bg-white/5 text-white rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#00D084] text-black font-bold rounded-xl">Save Strategy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Delete Confirmation Modal */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#111715] border border-red-500/30 rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">{deleteConfirmState.title}</h3>
              <p className="text-xs text-[#A5B0AA]">{deleteConfirmState.message}</p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteConfirmState(prev => ({ ...prev, isOpen: false }));
                  setDeleteError(null);
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold text-[#A5B0AA] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError(null);
                  try {
                    await deleteConfirmState.onConfirm();
                    setDeleteConfirmState(prev => ({ ...prev, isOpen: false }));
                  } catch (err: any) {
                    setDeleteError(err.message || 'Operation failed');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>{deleteConfirmState.confirmButtonText || 'Delete Permanently'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
