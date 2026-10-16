import React from 'react';
import { WebsiteSettings } from '../types.ts';
import { ArrowRight, Send, CheckCircle2, ShieldCheck, Trophy, TrendingUp, Sparkles, Key } from 'lucide-react';

interface HeroSectionProps {
  settings: WebsiteSettings;
  onExploreCourses: () => void;
  onOpenAccessModal: (courseId?: string) => void;
  onOpenCommunity?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  onExploreCourses,
  onOpenAccessModal,
}) => {
  return (
    <section id="hero" className="relative pt-8 pb-12 lg:pt-14 lg:pb-16 overflow-hidden bg-black">
      {/* Background glow orbs in rich gold */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-yellow-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Live Trust Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black border border-yellow-500/40 shadow-[0_0_20px_rgba(212,175,55,0.2)] mx-auto lg:mx-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-yellow-400 uppercase">
                {(settings as any).heroBadgeText || 'Elite Trading Mastery & VIP Signals'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              {(settings as any).heroTitlePrimary !== undefined ? (settings as any).heroTitlePrimary : 'Master The Markets With'}{' '}
              <span className="text-yellow-400 font-black">
                {(settings as any).heroTitleHighlight !== undefined ? (settings as any).heroTitleHighlight : 'Professional Precision'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {settings.heroSubtitle ||
                'Join thousands of profitable traders utilizing advanced Price Action, automated algorithms, and Jahid’s proven institutional setups.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onOpenAccessModal()}
                className="w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-black bg-lux-gradient hover:opacity-95 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:shadow-[0_0_45px_rgba(212,175,55,0.7)] flex items-center justify-center gap-2 sm:gap-3 cursor-pointer group"
              >
                <Key className="w-4 h-4 stroke-[2.5] text-black shrink-0" />
                <span className="font-extrabold whitespace-nowrap">Login with Trader ID / Join</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 shrink-0" />
              </button>

              <button
                onClick={onExploreCourses}
                className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-gray-200 bg-black hover:bg-neutral-900 border border-yellow-500/30 hover:border-yellow-500/70 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Courses & Bots</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
