import React from 'react';
import { SocialLink } from '../types.ts';
import { trackLinkClick } from '../api.ts';
import {
  Send,
  Youtube,
  Facebook,
  PhoneCall,
  Users,
  Instagram,
  ExternalLink,
  MessageCircle,
  Video,
  ArrowUpRight
} from 'lucide-react';

interface SocialLinksSectionProps {
  links: SocialLink[];
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({ links }) => {
  const getIcon = (iconName: string, category: string) => {
    const key = (iconName || category).toLowerCase();
    if (key.includes('youtube')) return <Youtube className="w-5 h-5 text-red-500" />;
    if (key.includes('facebook')) return <Facebook className="w-5 h-5 text-blue-500" />;
    if (key.includes('whatsapp') || key.includes('phone')) return <PhoneCall className="w-5 h-5 text-emerald-400" />;
    if (key.includes('telegram') || key.includes('send')) return <Send className="w-5 h-5 text-yellow-400" />;
    if (key.includes('discord') || key.includes('users')) return <Users className="w-5 h-5 text-yellow-500" />;
    if (key.includes('instagram')) return <Instagram className="w-5 h-5 text-pink-500" />;
    if (key.includes('message') || key.includes('chat')) return <MessageCircle className="w-5 h-5 text-emerald-400" />;
    if (key.includes('video')) return <Video className="w-5 h-5 text-yellow-400" />;
    return <ExternalLink className="w-5 h-5 text-yellow-400" />;
  };

  const handleLinkClick = (link: SocialLink) => {
    trackLinkClick(link.id);
  };

  const socialDisplayLinks = links.filter(l =>
    l.displayLocations?.includes('social_section') || l.displayLocations?.includes('footer')
  );

  return (
    <section id="socials" className="py-12 md:py-16 relative border-t border-yellow-500/15 bg-black">
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-yellow-500/30 text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3">
            <span>Verified Official Channels</span>
            <span aria-hidden="true" className="text-emerald-400">·</span>
            <span>Connect & Follow</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Official Channels & Direct <span className="text-yellow-400 font-extrabold">Portals</span>
          </h2>
          <p className="mt-3 text-base text-gray-300">
            Beware of impersonators. All verified social links, community portals, and direct desks are listed and maintained directly below.
          </p>
        </div>

        {/* Links Grid: Compact Icon-Style Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {socialDisplayLinks.map(link => (
            <a
              key={link.id}
              href={link.url}
              target={link.openInNewTab ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link)}
              className="group flex items-center gap-3.5 p-4 glass-panel border border-yellow-500/20 rounded-2xl hover:border-yellow-500/60 transition-all duration-300 shadow-lg bg-black hover:bg-neutral-900 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-black border border-yellow-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {getIcon(link.iconName, link.category)}
              </div>
              <div className="text-left min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-yellow-400 transition-colors truncate">{link.title}</h3>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono truncate">{link.category}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 shrink-0 transition-colors" />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
