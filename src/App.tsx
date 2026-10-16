import React, { useState, useEffect } from 'react';
import { PublicDataPayload, CourseService, SocialLink, PortfolioItem, WebsiteSettings, AnimationSettings } from './types.ts';
import { fetchPublicData, trackLinkClick } from './api.ts';
import { ThreeTradingBackground } from './components/ThreeTradingBackground.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { CoursesSection } from './components/CoursesSection.tsx';
import { BooksAndStrategySection } from './components/BooksAndStrategySection.tsx';
import { SocialLinksSection } from './components/SocialLinksSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AccessWorkflowModal } from './components/AccessWorkflowModal.tsx';
import { LegalModals } from './components/LegalModals.tsx';
import { AdminDashboard } from './components/AdminPanel/AdminDashboard.tsx';
import { Send, PhoneCall, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<PublicDataPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Active Views
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessModalCourseId, setAccessModalCourseId] = useState<string | undefined>(undefined);
  const [adminOpen, setAdminOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'risk' | 'terms' | 'privacy' | null>(null);
  const [activeSection, setActiveSection] = useState('hero');

  const loadData = async () => {
    try {
      const payload = await fetchPublicData();
      setData(payload);
    } catch (err: any) {
      console.error('Failed to load website data:', err);
      setError(err.message || 'Failed to initialize platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check if URL contains #admin or path is /admin
    if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      setAdminOpen(true);
    }

    // Scroll spy for navigation
    const handleScroll = () => {
      const sections = ['hero', 'courses', 'portfolio', 'library', 'socials'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenAccessModal = (courseId?: string) => {
    setAccessModalCourseId(courseId);
    setAccessModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center font-bold font-mono text-yellow-400 text-xl animate-pulse">
          J
        </div>
        <p className="text-xs font-mono tracking-widest text-gray-400 uppercase">
          Initializing Trading With Jahid...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500">Connection Notice</h2>
        <p className="text-sm text-gray-300 max-w-md">
          {error || 'Unable to connect to trading academy service.'}
        </p>
        <button
          onClick={loadData}
          className="px-5 py-2.5 bg-lux-gradient text-black text-xs font-bold rounded-xl cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-yellow-500/30 selection:text-yellow-400">
      
      {/* 3D Animated Candlestick Background */}
      <ThreeTradingBackground settings={data.animations} />

      {/* Main Website UI Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <Navbar
          settings={data.settings}
          onOpenAccessModal={handleOpenAccessModal}
          onOpenAdmin={() => setAdminOpen(true)}
          onNavigate={handleNavigate}
          activeSection={activeSection}
        />

        {/* Hero Section */}
        <div id="hero">
          <HeroSection
            settings={data.settings}
            onExploreCourses={() => handleNavigate('courses')}
            onOpenAccessModal={() => handleOpenAccessModal()}
            onOpenCommunity={() => handleNavigate('community')}
          />
        </div>

        {/* Featured Courses & Services Section */}
        <CoursesSection
          courses={data.courses}
          onOpenAccessModal={handleOpenAccessModal}
          settings={data.settings}
        />

        {/* Books & Strategy Section */}
        <BooksAndStrategySection
          books={data.books}
          strategies={data.strategies}
        />

        {/* Social Links & Portals Section */}
        <SocialLinksSection
          links={data.links}
        />

        {/* Footer */}
        <Footer
          settings={data.settings}
          links={data.links}
          onOpenAdmin={() => setAdminOpen(true)}
          onNavigate={handleNavigate}
          onOpenLegal={type => setLegalModalType(type)}
        />

      </div>

      {/* Floating Action Desk (Right bottom) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
        <button
          onClick={() => handleOpenAccessModal()}
          className="hidden sm:flex px-4 py-2.5 rounded-2xl bg-black/90 hover:bg-neutral-900 text-yellow-400 border border-yellow-500/40 shadow-[0_0_20px_rgba(212,175,55,0.3)] backdrop-blur-md text-xs font-mono items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          title="Login with Trader ID / Join with ID"
        >
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          <span className="font-sans font-bold text-white">Login with Trader ID</span>
        </button>

        <a
          href={data.settings.telegramCommunityUrl || 'https://t.me/tradewithjahid'}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] flex items-center justify-center transition-transform hover:scale-110"
          title="Open Telegram Community"
        >
          <Send className="w-5 h-5" />
        </a>
      </div>

      {/* Access Workflow 5-Step Modal */}
      <AccessWorkflowModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        courses={data.courses}
        initialCourseId={accessModalCourseId}
        logoUrl={data.settings.logoUrl}
      />

      {/* Legal & Compliance Modals (Risk Disclaimer, Terms, Privacy) */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        brandName={data.settings.brandName || 'Trading With Jahid'}
      />

      {/* Full Master Admin Panel */}
      <AdminDashboard
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onRefreshPublicData={loadData}
      />

    </div>
  );
}
