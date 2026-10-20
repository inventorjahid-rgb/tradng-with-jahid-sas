import React, { useState } from 'react';
import { BookItem, StrategyItem } from '../types.ts';
import { BookOpen, FileText, Image as ImageIcon, Download, Eye, X, ExternalLink, Sparkles, Award } from 'lucide-react';

interface BooksAndStrategySectionProps {
  books: BookItem[];
  strategies: StrategyItem[];
}

export const BooksAndStrategySection: React.FC<BooksAndStrategySectionProps> = ({ books, strategies }) => {
  const [activeTab, setActiveTab] = useState<'books' | 'strategies'>('books');
  const [selectedPdf, setSelectedPdf] = useState<BookItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<StrategyItem | null>(null);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  const handleSeePdf = (book: BookItem) => {
    if (book.pdfUrl && book.pdfUrl.trim() !== '') {
      window.open(book.pdfUrl, '_blank');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${book.title} - Trading With Jahid</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #040604; color: #F3F4F6; padding: 40px 20px; max-width: 850px; margin: 0 auto; line-height: 1.7; }
          .header { border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #D4AF37; font-size: 28px; margin: 0 0 10px 0; }
          .author { color: #10B981; font-family: monospace; font-size: 14px; }
          .desc { background: #0D140F; border: 1px solid rgba(212,175,55,0.2); padding: 20px; border-radius: 12px; margin-bottom: 30px; color: #D1D5DB; }
          .chapter { background: #0D140F; border: 1px solid rgba(212,175,55,0.2); padding: 24px; border-radius: 12px; margin-bottom: 20px; }
          .chapter h3 { color: #FBBF24; margin-top: 0; font-size: 18px; }
          .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 40px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${book.title}</h1>
          <div class="author">Author: ${book.author} | Trading With Jahid Official Academy</div>
        </div>
        <div class="desc"><strong>Overview:</strong> ${book.description}</div>
        <div class="chapter">
          <h3>Chapter 1: Institutional Price Action & Liquidity Mechanics</h3>
          <p>Institutional market makers engineer liquidity sweeps at key resistance and support levels before expanding impulsively.</p>
        </div>
        <div class="footer">
          &copy; 2026 Trading With Jahid Academy. All rights reserved.
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async (book: BookItem) => {
    if (book.pdfUrl && book.pdfUrl.trim() !== '') {
      try {
        const response = await fetch(book.pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        window.open(book.pdfUrl, '_blank');
      }
      return;
    }

    const textContent = `====================================================================
${book.title.toUpperCase()}
Author: ${book.author}
Published by Trading With Jahid Official Academy
====================================================================

BOOK DESCRIPTION:
${book.description}

====================================================================
Official Telegram Community: https://t.me/tradewithjahid
&copy; 2026 Trading With Jahid. All Rights Reserved.
====================================================================`;

    const blob = new Blob([textContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="library" className="py-12 md:py-16 relative border-t border-yellow-500/15 bg-black">
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-left max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-yellow-500/30 text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3">
            <BookOpen className="w-4 h-4 text-yellow-400" />
            <span>Institutional Literature & Blueprints</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Exclusive Trading E-Books & <span className="text-yellow-400 font-extrabold">Verified Setups</span>
          </h2>
          <p className="mt-3 text-base text-gray-300 leading-relaxed">
            Expand your trading IQ with published e-books, institutional strategy playbooks, and high-probability chart blueprints.
          </p>

          {/* Toggle Tabs */}
          <div className="mt-8 flex items-center gap-2 p-1.5 glass-panel rounded-2xl border border-yellow-500/20 w-fit">
            <button
              onClick={() => setActiveTab('books')}
              className={`px-6 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'books'
                  ? 'bg-lux-gradient text-black font-bold shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-black" />
              <span>E-Books & Guides ({books.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('strategies')}
              className={`px-6 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'strategies'
                  ? 'bg-lux-gradient text-black font-bold shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-black" />
              <span>Strategy Playbooks ({strategies.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BOOKS */}
        {activeTab === 'books' && (
          books.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl border border-yellow-500/20 bg-[#0D140F]/50">
              <BookOpen className="w-8 h-8 text-yellow-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No books or guides published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {books.map(book => (
              <div
                key={book.id}
                className="group relative glass-panel rounded-3xl overflow-hidden flex flex-col justify-between border border-yellow-500/20 hover:border-yellow-500/60 transition-all shadow-xl bg-[#0D140F]"
              >
                <div className="relative aspect-[16/10] w-full bg-[#040604] overflow-hidden border-b border-yellow-500/15">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-yellow-400 bg-[#040604]">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D140F] via-transparent to-transparent opacity-80" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-mono bg-[#040604]/85 text-yellow-300 border border-yellow-500/30 backdrop-blur-md">
                    {(book as any).category || 'E-Book'}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-left">
                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {book.title}
                    </h3>
                    <div className="text-xs text-emerald-400 font-mono">By {book.author}</div>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-yellow-500/15 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSeePdf(book)}
                      className="py-2.5 px-3 bg-lux-gradient hover:opacity-95 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-black" />
                      <span className="text-black font-bold">Read / Open</span>
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(book)}
                      className="py-2.5 px-3 bg-[#040604] hover:bg-white/10 text-yellow-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-yellow-500/25 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        )}

        {/* TAB 2: STRATEGIES */}
        {activeTab === 'strategies' && (
          strategies.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl border border-yellow-500/20 bg-[#0D140F]/50">
              <FileText className="w-8 h-8 text-yellow-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No strategy playbooks published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {strategies.map(strat => (
              <div
                key={strat.id}
                onClick={() => setSelectedImage(strat)}
                className="group relative glass-panel rounded-3xl overflow-hidden flex flex-col justify-between border border-yellow-500/20 hover:border-yellow-500/60 transition-all shadow-xl bg-[#0D140F] cursor-pointer"
              >
                <div className="relative aspect-[16/10] w-full bg-[#040604] overflow-hidden border-b border-yellow-500/15">
                  <img
                    src={strat.imageUrl}
                    alt={strat.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D140F] via-transparent to-transparent opacity-80" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-mono bg-[#040604]/85 text-yellow-300 border border-yellow-500/30 backdrop-blur-md">
                    {strat.category}
                  </div>

                  {strat.winRate && (
                    <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold backdrop-blur-md flex items-center gap-1 shadow-sm">
                      <Award className="w-3 h-3 text-emerald-400" />
                      <span>{strat.winRate}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-left">
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors leading-snug">
                      {strat.title}
                    </h3>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {strat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-yellow-500/15 flex items-center justify-between text-xs font-mono text-yellow-400">
                    <span>Click to view full picture</span>
                    <Eye className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        )}

      </div>

      {/* PDF READER MODAL */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-[#0D140F] border border-yellow-500/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-end px-6 py-4 border-b border-yellow-500/20 bg-[#040604]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPdf(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-yellow-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#040604] overflow-y-auto p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-yellow-500/20 bg-[#0D140F]">
                {selectedPdf.coverImage ? (
                  <img src={selectedPdf.coverImage} alt={selectedPdf.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0D140F] text-yellow-400">
                    <FileText className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">{selectedPdf.title}</h4>
                <p className="text-xs text-emerald-400 font-mono">By {selectedPdf.author}</p>
                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{selectedPdf.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                <button
                  onClick={() => handleSeePdf(selectedPdf)}
                  className="py-3 px-4 bg-lux-gradient hover:opacity-95 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-black" />
                  <span className="text-black font-bold">See PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(selectedPdf)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-yellow-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-yellow-400" />
                  <span>Download</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STRATEGY PICTURE ZOOM MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-[#0D140F] border border-yellow-500/30 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-[#040604]">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white">{selectedImage.title}</h3>
                  <span className="text-xs text-emerald-400 font-mono">{selectedImage.category} • {selectedImage.winRate}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-yellow-400" />
              </button>
            </div>

            <div className="p-6 bg-black/80 overflow-y-auto space-y-4 text-center">
              <div
                onClick={() => setFullScreenImageUrl(selectedImage.imageUrl)}
                className="rounded-2xl overflow-hidden border border-yellow-500/25 max-h-[55vh] flex items-center justify-center bg-black cursor-pointer group relative"
                title="Click to view full screen"
              >
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[55vh] w-auto object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-yellow-400 font-mono text-xs font-bold gap-2">
                  <Eye className="w-5 h-5" /> Click for Full Screen
                </div>
              </div>

              <div className="text-left bg-[#0D140F] p-4 rounded-2xl border border-yellow-500/20 max-w-2xl mx-auto space-y-1">
                <h4 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">Strategy Execution Note</h4>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{selectedImage.description}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX MODAL */}
      {fullScreenImageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <button
            onClick={() => setFullScreenImageUrl(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-10 border border-white/20"
            title="Close Full Screen"
          >
            <X className="w-6 h-6 text-yellow-400" />
          </button>
          <div className="max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <img
              src={fullScreenImageUrl}
              alt="Full Screen Strategy View"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[95vh] object-contain rounded-2xl shadow-2xl border border-yellow-500/30"
            />
          </div>
        </div>
      )}

    </section>
  );
};
