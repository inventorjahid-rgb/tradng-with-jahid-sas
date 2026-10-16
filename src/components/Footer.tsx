import React from 'react';
import { WebsiteSettings, SocialLink } from '../types.ts';
import { trackLinkClick } from '../api.ts';
import { Shield, ArrowUp, AlertTriangle } from 'lucide-react';

interface FooterProps {
  settings: WebsiteSettings;
  links: SocialLink[];
  onOpenAdmin: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenLegal: (type: 'risk' | 'terms' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  links,
  onOpenAdmin,
  onNavigate,
  onOpenLegal,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = links.filter(l => l.displayLocations?.includes('footer'));

  return (
    <footer className="border-t border-yellow-500/20 bg-black text-gray-300 text-left pt-10 pb-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand & Mission (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 rounded-full overflow-hidden p-[2px] bg-lux-gradient shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#040604]">
                  <img
                    src={settings.logoUrl || '/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg'}
                    alt={settings.brandName || 'Trading With Jahid'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/trading_with_jahid_logo_1791908793141.jpg';
                    }}
                  />
                </div>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                {settings.brandName || 'Trading With Jahid'}
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              {settings.tagline || 'Institutional Precision. High-Probability Trading Education.'}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {footerLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(link.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0D140F] hover:bg-white/10 text-yellow-300 text-xs border border-yellow-500/20 transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Nav (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono">Platform Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-yellow-400 transition-colors cursor-pointer">
                  Binary Trading Course
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-yellow-400 transition-colors cursor-pointer">
                  Forex Institutional Course
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-yellow-400 transition-colors cursor-pointer">
                  Algorithmic Quant Bots
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('portfolio')} className="hover:text-yellow-400 transition-colors cursor-pointer">
                  Live Trade Breakdown Journal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} className="hover:text-yellow-400 transition-colors cursor-pointer">
                  VIP Telegram Channel
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Risk Disclosure (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono">Regulatory & Disclosures</h4>
            <div className="p-4 rounded-2xl glass-panel border border-yellow-500/20 space-y-2 bg-[#0D140F]">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>High Risk Warning</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Trading foreign exchange, binary options, and crypto carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 text-[11px] font-mono text-emerald-400">
                <button onClick={() => onOpenLegal('risk')} className="hover:underline cursor-pointer">Risk Disclosure</button>
                <span>•</span>
                <button onClick={() => onOpenLegal('terms')} className="hover:underline cursor-pointer">Terms of Service</button>
                <span>•</span>
                <button onClick={() => onOpenLegal('privacy')} className="hover:underline cursor-pointer">Privacy Policy</button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-yellow-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
          <div>
            &copy; {new Date().getFullYear()} {settings.brandName || 'Trading With Jahid'}. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span>Admin Portal</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-2.5 rounded-xl bg-[#0D140F] hover:bg-[#131A15] text-yellow-400 border border-yellow-500/25 transition-all cursor-pointer"
              title="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
