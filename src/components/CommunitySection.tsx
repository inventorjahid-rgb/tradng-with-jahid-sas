import React from 'react';
import { WebsiteSettings } from '../types.ts';
import { Send, MessageSquare, CheckCircle, ArrowUpRight } from 'lucide-react';

interface CommunitySectionProps {
  settings: WebsiteSettings;
  onOpenAccessModal: () => void;
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({ settings }) => {
  const perks = [
    'Daily Pre-Market Watchlists (Forex London & NY sessions)',
    'High-Frequency Binary Options Rejection Alerts & Confluence',
    'Live Voice Stream Chart Reviews with Jahid',
    'Trading Psychology & Emotional Discipline Support Channel',
    'Curated Indicators, Custom Risk Calculators & Notion Templates'
  ];

  return (
    <section id="community" className="py-20 md:py-32 relative border-t border-yellow-500/15 bg-[#040604]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-yellow-500/30 p-8 sm:p-12 lg:p-16 text-left bg-[#0D140F] shadow-[0_0_50px_rgba(212,175,55,0.15)]">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-lux-gradient opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-yellow-500/30 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                <Send className="w-4 h-4 text-yellow-400" />
                <span>The Trading Brotherhood</span>
                <span aria-hidden="true" className="text-emerald-400">·</span>
                <span className="text-emerald-400">14,800+ Members</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Join The Official “Trading With Jahid” <span className="text-transparent bg-clip-text bg-lux-gradient">Community</span>
              </h2>

              <p className="text-base text-gray-300 leading-relaxed max-w-xl">
                Trading alone leads to emotional tilt, over-leveraging, and retail traps. Join thousands of dedicated market practitioners sharing live charts, trade reasoning, and real accountability.
              </p>

              <ul className="space-y-3 pt-2">
                {perks.map((perk, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href={settings.telegramCommunityUrl || 'https://t.me/tradewithjahid'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-4 text-sm font-semibold text-black bg-lux-gradient hover:opacity-95 rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span className="text-black font-bold">Join Telegram Community</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5] text-black font-bold" />
                </a>

                <a
                  href={settings.telegramAdminUrl || 'https://t.me/tradewithjahid'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 text-sm font-medium text-white bg-[#040604] hover:bg-white/5 border border-yellow-500/25 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 text-yellow-400" />
                  <span>Message Jahid Directly</span>
                </a>
              </div>

            </div>

            {/* Right Card: Telegram Channel Preview Box */}
            <div className="lg:col-span-5">
              <div className="bg-[#040604] p-6 sm:p-8 rounded-3xl border border-yellow-500/25 shadow-2xl space-y-5">
                
                <div className="flex items-center justify-between pb-4 border-b border-yellow-500/15">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden p-[2px] bg-lux-gradient shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#040604]">
                        <img
                          src={settings.logoUrl || '/src/assets/images/trading_with_jahid_logo_1791908793141.jpg'}
                          alt="Trading With Jahid Official Logo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Trading With Jahid</h4>
                      <span className="text-xs text-yellow-400 font-mono">t.me/tradewithjahid</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>

                <div className="space-y-3 text-xs text-gray-300 font-mono bg-[#0D140F] p-4 rounded-2xl border border-yellow-500/20">
                  <div className="text-yellow-400 font-bold">🔔 VIP SIGNAL ALERT • EUR/USD</div>
                  <div>⚡️ Setup: BOS + Order Block Rejection</div>
                  <div>🎯 Entry: 1.08420 | TP1: 1.08900</div>
                  <div className="text-emerald-400 font-bold pt-1">✅ STATUS: TARGET 1 HIT (+48 PIPs)</div>
                </div>

                <a
                  href={settings.telegramCommunityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-lux-gradient hover:opacity-95 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span className="text-black font-bold">Access VIP Telegram Free</span>
                </a>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
