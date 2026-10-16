import React, { useState } from 'react';
import { WebsiteSettings } from '../types.ts';
import { Menu, X, Shield, ArrowUpRight, Key } from 'lucide-react';

interface NavbarProps {
  settings: WebsiteSettings;
  onOpenAccessModal: (courseId?: string) => void;
  onOpenAdmin: () => void;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenAccessModal,
  onOpenAdmin,
  onNavigate,
  activeSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'courses', label: 'Courses & Bots' },
    { id: 'portfolio', label: 'Live Signals & Trades' },
    { id: 'library', label: 'Books & Strategy' },
    { id: 'socials', label: 'Direct Links' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/95 border-b border-yellow-500/20 transition-colors duration-200 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-6 h-16 sm:h-20">
          
          {/* Brand Wordmark with Luxury Gold Emblem */}
          <button
            onClick={() => handleNavClick('hero')}
            className="text-left group flex items-center gap-2.5 sm:gap-3.5 shrink min-w-0 cursor-pointer focus-visible:outline-none"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden p-[2px] bg-lux-gradient shadow-[0_0_20px_rgba(212,175,55,0.4)] shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-black">
                <img
                  src={settings.logoUrl || '/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg'}
                  alt={settings.brandName || 'Trading With Jahid'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/trading_with_jahid_logo_1791908793141.jpg';
                  }}
                />
              </div>
            </div>
            <span className="text-sm sm:text-lg font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-lux-gradient group-hover:bg-clip-text transition-all truncate">
              {settings.brandName || 'Trading With Jahid'}
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
            {navLinks.map(link => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`whitespace-nowrap shrink-0 transition-all cursor-pointer py-1 relative ${
                    isActive
                      ? 'text-yellow-400 font-semibold'
                      : 'hover:text-yellow-300'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lux-gradient rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions - Fully Responsive for Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Admin Portal Button - Always Visible on Mobile and Desktop */}
            <button
              onClick={onOpenAdmin}
              title="Admin Portal (এডমিন প্যানেল)"
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-mono font-bold text-yellow-400 hover:text-white bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl transition-all border border-yellow-500/30 hover:border-yellow-500/60 cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => onOpenAccessModal()}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs font-bold text-black bg-lux-gradient hover:opacity-95 rounded-xl transition-all duration-200 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 stroke-[2.5] text-black" />
              <span className="text-black font-extrabold hidden md:inline">Login with Trader ID</span>
              <span className="text-black font-extrabold md:hidden">Login ID</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-yellow-400 hover:text-white focus:outline-none rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-yellow-400" /> : <Menu className="w-6 h-6 text-yellow-400" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black border-b border-yellow-500/20 px-4 py-5 space-y-4 shadow-2xl">
          {/* Prominent Admin Access Button for Mobile at the very top */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className="w-full py-3.5 text-xs font-mono font-bold text-black bg-lux-gradient rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            <Shield className="w-4 h-4 text-black stroke-[2.5]" />
            <span>ADMIN PANEL (এডমিন প্যানেলে প্রবেশ করুন)</span>
          </button>

          <div className="flex flex-col space-y-2 pt-2 border-t border-yellow-500/15">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-left py-2 px-2 text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-yellow-500/20 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAccessModal();
              }}
              className="w-full py-3 text-xs font-bold text-white bg-neutral-900 border border-yellow-500/30 rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Key className="w-4 h-4 text-yellow-400 stroke-[2.5]" />
              <span>Login with Trader ID / Join with ID</span>
            </button>

            <a
              href={settings.telegramCommunityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-yellow-300 transition-colors border border-yellow-500/20"
            >
              Telegram Community
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
