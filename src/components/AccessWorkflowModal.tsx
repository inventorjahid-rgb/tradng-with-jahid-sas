import React, { useState, useEffect } from 'react';
import { CourseService } from '../types.ts';
import { submitAccountId, checkVerification } from '../api.ts';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Send,
  Key,
  Sparkles,
  UserCheck,
  Copy,
  Check,
  Ban
} from 'lucide-react';

interface AccessWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseService[];
  initialCourseId?: string;
  initialTab?: 'login' | 'request';
  logoUrl?: string;
  telegramCommunityUrl?: string;
}

export const AccessWorkflowModal: React.FC<AccessWorkflowModalProps> = ({
  isOpen,
  onClose,
  courses,
  initialCourseId,
  initialTab = 'request',
  logoUrl,
  telegramCommunityUrl = 'https://t.me/tradewithjahid',
}) => {
  // First tab: 'request' (New Account Registration), Second tab: 'login' (Login with Trader ID)
  const [activeTab, setActiveTab] = useState<'login' | 'request'>(initialTab);
  
  // Selected course
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || (courses.length > 0 ? courses[0].id : '')
  );

  // Form Fields
  const [accountId, setAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Success Approval State
  const [isApproved, setIsApproved] = useState(false);
  const [approvedSubmissionId, setApprovedSubmissionId] = useState('');
  const [approvedJoinUrl, setApprovedJoinUrl] = useState('');
  const [approvedAccountId, setApprovedAccountId] = useState('');

  // Banned / Rejected State
  const [isBanned, setIsBanned] = useState(false);
  const [bannedMsg, setBannedMsg] = useState('');

  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const finalJoinUrl = approvedJoinUrl || currentCourse?.joinUrl || telegramCommunityUrl || 'https://t.me/tradewithjahid';

  // Handle Trader ID Submission & Instant Approval
  const handleApproveTraderId = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsBanned(false);
    setBannedMsg('');

    const cleanId = accountId.trim();
    if (!cleanId) {
      setErrorMsg('অনুগ্রহ করে আপনার ট্রেডার আইডি দিন (Please enter your Trader ID).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitAccountId({
        courseId: currentCourse?.id || 'default_vip',
        accountId: cleanId,
        telegramHandle: 'VIP Member',
      });

      if (res.isBanned || res.status === 'Rejected') {
        setIsBanned(true);
        setIsApproved(false);
        setBannedMsg(res.message || 'এই ট্রেডার আইডিটি ব্যান/রিজেক্ট করা হয়েছে। এই আইডির জন্য কোনো ভিআইপি লিংক দেওয়া হবে না।');
        return;
      }

      setIsApproved(true);
      setIsBanned(false);
      setApprovedAccountId(cleanId);
      setApprovedSubmissionId(res.submissionId || `SUB-${Math.floor(1000 + Math.random() * 9000)}`);
      setApprovedJoinUrl(res.joinUrl || finalJoinUrl);
    } catch (err: any) {
      if (err.isBanned || err.status === 'Rejected' || err.status === 403) {
        setIsBanned(true);
        setIsApproved(false);
        setBannedMsg(err.message || 'এই ট্রেডার আইডিটি ব্যান/রিজেক্ট করা হয়েছে। এই আইডির জন্য ভিআইপি অ্যাক্সেস বন্ধ রয়েছে।');
      } else {
        setErrorMsg(err.message || 'Submission failed. Please check inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (finalJoinUrl) {
      navigator.clipboard.writeText(finalJoinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetModal = () => {
    setAccountId('');
    setErrorMsg('');
    setIsApproved(false);
    setIsBanned(false);
    setBannedMsg('');
    setApprovedSubmissionId('');
    setApprovedJoinUrl('');
    setApprovedAccountId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-black border border-yellow-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] text-left my-8">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-yellow-500/20 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-yellow-500/50 shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0 bg-black">
              <img
                src={logoUrl || '/uploads/photo_2026-07-21_19-31-56_1791911766485.jpg'}
                alt="Trading With Jahid"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/trading_with_jahid_logo_1791908793141.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>INSTANT TRADER VERIFICATION</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Trading Academy & VIP Service
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: First New Account Registration, then Login with Trader ID */}
        <div className="flex border-b border-yellow-500/20 bg-neutral-950">
          <button
            onClick={() => {
              setActiveTab('request');
              setErrorMsg('');
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'request'
                ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/10'
                : 'text-gray-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>New Account Registration</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'login'
                ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/10'
                : 'text-gray-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Key className="w-4 h-4 text-yellow-400" />
            <span>Login with Trader ID / Join with ID</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: LOGIN WITH TRADER ID / JOIN WITH ID (INSTANT APPROVAL) */}
        {/* ======================================================== */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-6 bg-black">
            
            {/* If BANNED: Show Access Denied / Banned Screen (NO VIP LINK) */}
            {isBanned ? (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)]">
                  <Ban className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs font-bold">
                    <span>●</span> ACCESS REJECTED & BANNED
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    Trader ID Banned (অ্যাক্সেস বন্ধ)
                  </h3>
                  <p className="text-xs text-red-300 max-w-md mx-auto leading-relaxed">
                    {bannedMsg || 'এই ট্রেডার আইডিটি এডমিন কর্তৃক বাতিল বা ব্যান করা হয়েছে। এই আইডির জন্য কোনো ভিআইপি লিংক অনুমোদন করা হবে না।'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-red-500/30 max-w-sm mx-auto text-left text-xs font-mono space-y-2.5 shadow-xl">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-gray-400">Trader ID:</span>
                    <span className="text-red-400 font-bold line-through">{accountId}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-gray-400">VIP Access:</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40 text-[10px]">
                      BLOCKED / NO LINK
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-red-400 font-bold">REJECTED / BANNED</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsBanned(false);
                      setAccountId('');
                      setErrorMsg('');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/30 rounded-xl transition-all cursor-pointer"
                  >
                    Try Another ID (অন্য আইডি দিন)
                  </button>

                  <button
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : !isApproved ? (
              <form onSubmit={handleApproveTraderId} className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-yellow-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-yellow-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>INSTANT APPROVAL PROTOCOL</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Login / Join with Trader ID
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    এখানে আপনার ব্রোকার ট্রেডার আইডি (Trader ID) দিন। আইডি সাবমিট করলেই সাথে সাথে <strong className="text-yellow-400">অ্যাপ্রুভ</strong> হয়ে যাবে এবং ভিআইপি লিংক আনলক হবে।
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Course/Service selector if multiple available */}
                {courses.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-200 block">
                      Select Access Category / Course:
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-yellow-500/30 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-400"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id} className="bg-black text-white">
                          {c.title} ({c.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Trader ID Input Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Trader ID / Join ID <span className="text-yellow-400">*</span></span>
                    <span className="text-[11px] text-gray-400 font-normal">Pocket Option / Quotex / Broker ID</span>
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-yellow-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 92862280 বা আপনার ট্রেডার আইডি"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-yellow-500/30 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400 font-mono tracking-wide"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 block pt-0.5">
                    *কোনো পাসওয়ার্ড লাগবে না, শুধু আপনার ব্রোকারের পাবলিক ট্রেডার আইডি দিন।
                  </span>
                </div>

                {/* Approve & Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-sm font-bold text-black bg-lux-gradient hover:opacity-95 disabled:opacity-50 rounded-2xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Approving Trader ID...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve & Unlock VIP Access (অ্যাপ্রুভ করুন)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                {/* Switch to Register link */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-gray-400">Don't have a Trader ID yet? </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('request')}
                    className="text-xs text-yellow-400 hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Create Broker Account Here →
                  </button>
                </div>
              </form>
            ) : (
              /* ======================================================== */
              /* SUCCESS STATE: APPROVED! UNLOCK VIP INVITATION LINK */
              /* ======================================================== */
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                    <span>●</span> APPROVED & VERIFIED
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    Trader ID Approved Successfully!
                  </h3>
                  <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                    আপনার ট্রেডার আইডি সফলভাবে অ্যাপ্রুভ করা হয়েছে! আজীবনের জন্য ফ্রি ভিআইপি চ্যানেলে যুক্ত হতে নিচের লিংকে ক্লিক করুন।
                  </p>
                </div>

                {/* Details summary */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-yellow-500/30 max-w-sm mx-auto text-left text-xs font-mono space-y-2.5 shadow-xl">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-gray-400">Trader ID:</span>
                    <span className="text-white font-bold">{approvedAccountId || accountId}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-gray-400">Approval Status:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-[10px]">
                      APPROVED & ACTIVE
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Service:</span>
                    <span className="text-yellow-400 truncate max-w-[180px]">
                      {currentCourse?.title || 'VIP Signals & Community'}
                    </span>
                  </div>
                </div>

                {/* Big Action Button to Join VIP Telegram */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={finalJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-8 py-4 text-xs font-bold text-black bg-lux-gradient hover:opacity-95 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:shadow-[0_0_40px_rgba(212,175,55,0.7)] cursor-pointer uppercase tracking-wider"
                  >
                    <Send className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>JOIN VIP TELEGRAM NOW (এখনই যুক্ত হন)</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto px-4 py-4 text-xs font-semibold text-gray-200 bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/30 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-400" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REGISTER NEW BROKER ACCOUNT */}
        {/* ======================================================== */}
        {activeTab === 'request' && (
          <div className="p-6 sm:p-8 space-y-6 bg-black">
            
            <div className="p-4 rounded-2xl bg-neutral-950 border border-yellow-500/20 space-y-2">
              <span className="text-xs font-mono text-yellow-400 font-semibold">STEP 1: REGISTRATION</span>
              <h3 className="text-lg font-bold text-white">
                Create Broker Account
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                আপনার যদি এখনও কোনো ব্রোকার আইডি না থাকে, তবে নিচের অফিসিয়াল লিংক থেকে অ্যাকাউন্ট তৈরি করুন। অ্যাকাউন্ট তৈরি শেষ হলে আপনার <strong>Trader ID</strong> নিয়ে এসে "Login with Trader ID" ট্যাবে দিন।
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-950 border border-yellow-500/30 text-center space-y-4">
              <div className="text-xs text-gray-300">
                অফিসিয়াল পার্টনার পোর্টালে অ্যাকাউন্ট খুলতে নিচে ক্লিক করুন:
              </div>

              <a
                href={currentCourse?.registrationUrl || 'https://pocketoption.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold text-black bg-lux-gradient hover:opacity-95 rounded-2xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <span>CREATE BROKER ACCOUNT NOW</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>

              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                *রেজিস্ট্রেশন শেষে আপনার ট্রেডার আইডি সংগ্রহ করুন, এরপর "Login with Trader ID" অপশনে এসে আইডি প্রদান করলেই তা ইনস্ট্যান্ট অ্যাপ্রুভ হয়ে যাবে।
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">রেজিস্ট্রেশন শেষ করেছেন?</span>
              <button
                onClick={() => setActiveTab('login')}
                className="px-5 py-2.5 text-xs font-bold text-black bg-lux-gradient hover:opacity-95 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Go to: Login with Trader ID</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
