import React from 'react';
import { X, ShieldAlert, FileText, Lock } from 'lucide-react';

interface LegalModalsProps {
  type: 'risk' | 'terms' | 'privacy' | null;
  onClose: () => void;
  brandName: string;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ type, onClose, brandName }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111715] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-left my-8 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0e1412]">
          <div className="flex items-center gap-3">
            {type === 'risk' && <ShieldAlert className="w-5 h-5 text-red-400" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-[#00D084]" />}
            {type === 'privacy' && <Lock className="w-5 h-5 text-[#D4AF37]" />}

            <h3 className="text-lg font-bold text-white">
              {type === 'risk' && 'High-Risk Financial Disclosure & Disclaimer'}
              {type === 'terms' && 'Terms and Conditions of Service'}
              {type === 'privacy' && 'Privacy Policy & Data Security'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#A5B0AA] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto text-xs text-[#A5B0AA] space-y-4 leading-relaxed">
          {type === 'risk' && (
            <>
              <p className="text-sm font-semibold text-red-300">
                Trading in Forex, Binary Options, Derivatives, Cryptocurrencies, and Financial Contracts carries a substantial level of risk and may result in the loss of all your invested capital.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Nature of Educational Content</h4>
              <p>
                All materials, courses, indicators, strategies, videos, signals, trade journals, and bot configurations published by {brandName} are intended exclusively for educational, illustrative, and technical research purposes. Nothing on this website constitutes financial, investment, legal, or tax advice.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. No Guaranteed Returns</h4>
              <p>
                {brandName} and its affiliates do not make any representations, guarantees, or promises regarding profitability. Hypothetical, backtested, or simulated trading performances have inherent limitations and do not represent actual trading executed under volatile or illiquid market conditions.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Independent Capital Responsibility</h4>
              <p>
                You are solely responsible for evaluating your risk tolerance, financial position, and experience before entering financial markets. You should never risk capital that you cannot afford to lose entirely.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Acceptance of Terms</h4>
              <p>
                By accessing {brandName}, enrolling in our educational courses, joining our Telegram community, or deploying our trading bots, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Intellectual Property</h4>
              <p>
                All strategy documents, proprietary charts, video breakdowns, bot scripts, and brand assets remain the exclusive intellectual property of {brandName}. Unauthorized duplication, resale, distribution, or rebroadcasting of signals is strictly prohibited and subject to immediate revocation of access.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Account Verification Protocol</h4>
              <p>
                Access to private VIP rooms and signals requires verification of an eligible partner Broker Account ID. {brandName} reserves the right to reject, suspend, or revoke access for any account found to violate platform standards or provide invalid credentials.
              </p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Data Minimization & Collection</h4>
              <p>
                {brandName} is committed to user confidentiality. We only collect public Trader/Account IDs, Telegram handles, and optional email contacts necessary to verify course eligibility and deliver private VIP portal access.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. No Sensitive Financial Data Requested</h4>
              <p>
                We never request, store, or process private passwords, OTP codes, broker login passwords, seed phrases, or private financial credentials.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Third-Party Links</h4>
              <p>
                Our service contains links to external platforms including Telegram, YouTube, and partner brokers. We are not responsible for the privacy practices or data policies of independent third-party services.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex justify-end bg-[#0e1412] shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
