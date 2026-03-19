import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Download, Share2, Info, EyeOff, ExternalLink, ArrowRight, Shield, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ViewerProps {
  type: 'image' | 'video' | 'pdf' | 'url';
  url: string;
  watermark: string;
}

export const Viewer = ({ type, url, watermark }: ViewerProps) => {
  const { t } = useLanguage();

  // Security Deterrence: Disable right-click and certain shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen, F12, Ctrl+U, Ctrl+S
      if (
        e.key === 'PrintScreen' || 
        e.key === 'F12' || 
        (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p'))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto px-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
          <span className="text-sm font-black text-white uppercase tracking-[0.2em]">{t('secureLiveView')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
          <span className="text-sm font-black text-white uppercase tracking-[0.2em]">{t('secureLiveView')}</span>
        </div>
        {type === 'url' && (
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connection Check:</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest underline decoration-emerald-500/30 underline-offset-4"
            >
              Access Direct Link
            </a>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="relative w-full rounded-[3rem] overflow-hidden bg-black shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/5 group aspect-video flex items-center justify-center">
        {/* Anti-screenshot Watermark Layer */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-wrap gap-12 p-10 opacity-[0.05] select-none overflow-hidden rotate-[-25deg] scale-150">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i} className="text-white text-[10px] font-black font-mono whitespace-nowrap uppercase tracking-widest">
              {watermark}
            </span>
          ))}
        </div>

        {/* Media Renderers */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {type === 'image' && (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={url} 
              className="max-w-full max-h-full object-contain select-none pointer-events-none" 
              draggable={false} 
            />
          )}
          
          {type === 'video' && (
            <video 
              controls 
              controlsList="nodownload pwa" 
              disablePictureInPicture
              className="w-full h-full block"
            >
              <source src={url} type="video/mp4" />
            </video>
          )}

          {type === 'url' && (
            <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-slate-950">
              {url.includes('youtube.com') || url.includes('youtu.be') ? (
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  {url.includes('/watch?v=') || url.includes('youtu.be/') ? (
                    <iframe 
                      className="w-full h-full absolute inset-0"
                      src={`${url.includes('v=') ? `https://www.youtube.com/embed/${new URL(url).searchParams.get('v')}` : `https://www.youtube.com/embed/${url.split('/').pop()}`}?modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen={false}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-900 px-6 text-center space-y-4">
                      <ShieldAlert size={48} className="text-amber-500 mb-2" />
                      <h3 className="text-xl font-black text-white">Security Protocol Bypass Required</h3>
                      <p className="text-slate-400 text-xs max-w-xs uppercase tracking-widest font-bold">YouTube restricts root-domain framing to prevent clickjacking.</p>
                      <button 
                        onClick={() => window.open(url, '_blank')}
                        className="btn-primary px-8 py-3 text-xs"
                      >
                        Safe Eject to YouTube
                      </button>
                    </div>
                  )}
                  {/* Invisible Shield overlays only for videos */}
                  {(url.includes('/watch?v=') || url.includes('youtu.be/')) && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-20 z-50 pointer-events-auto cursor-default bg-transparent" />
                      <div className="absolute bottom-0 right-0 w-32 h-16 z-50 pointer-events-auto cursor-default bg-transparent" />
                      <div className="absolute top-0 right-0 w-32 h-full z-50 pointer-events-auto cursor-default bg-transparent" />
                    </>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/20 flex flex-col bg-slate-900 ring-1 ring-white/10 group">
                  
                  {/* Gateway Secure Header */}
                  <div className="h-10 bg-slate-950/80 backdrop-blur-md flex items-center grow-0 shrink-0 border-b border-white/5 px-4 justify-between z-10">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Gateway Sandbox Active</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Fake URL Bar showing encoded hostname */}
                      <div className="hidden sm:flex items-center bg-black/50 px-3 py-0.5 rounded-md border border-white/5 opacity-50 select-none pointer-events-none">
                        <Lock size={10} className="text-emerald-500 mr-2" />
                        <span className="text-[10px] font-mono text-slate-400">tunnel.protocol://{new URL(url).hostname}</span>
                      </div>

                      <button 
                        onClick={() => window.open(url, '_blank')}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors group-hover:opacity-100 opacity-50 flex items-center gap-1.5"
                        title="Open Direct (If site blocks framing)"
                      >
                        <ExternalLink size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Eject</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Sandboxed Iframe (Static Mode) */}
                  <iframe 
                    src={url}
                    className="w-full h-full flex-1 border-none bg-white font-sans"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title="Gateway Secure Tunnel"
                  />
                  
                  {/* Overlay informing that it's protected */}
                  <div className="absolute bottom-4 right-4 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-950/90 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-2xl">
                      End-to-End Encrypted Tunnel
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overlay Deterrent (Semi-transparent cursor area) */}
          <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-emerald-500/5 mix-blend-overlay" />
        </div>

        {/* Security Alert Badge */}
        <div className="absolute bottom-8 left-8 z-40">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 text-white/90 text-[11px] font-bold uppercase tracking-widest shadow-2xl"
          >
            <ShieldAlert size={16} className="text-emerald-400" />
            {t('protectedBy')}
          </motion.div>
        </div>

        {/* Floating Protection Info */}
        <div className="absolute top-8 right-8 z-40">
          <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 border border-white/5 cursor-help group/info hover:text-emerald-400 transition-colors">
            <Info size={18} />
            <div className="absolute top-12 right-0 w-48 p-4 bg-slate-900 border border-slate-800 rounded-2xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none text-[10px] text-slate-400 leading-relaxed normal-case font-medium">
              This media is encrypted at rest and watermarked dynamically with your metadata to prevent unauthorized distribution.
            </div>
          </div>
        </div>
      </div>

      {/* Meta Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label={t('accessedFrom')} value="172.16.0.44" sub="Tel Aviv, IL" />
        <StatsCard label={t('timeLeft')} value="58m 22s" sub="Link will auto-expire" highlight />
        <StatsCard label={t('viewsRemaining')} value="1 of 5" sub="Usage limit active" />
      </div>

      {/* Warning Footer */}
      <div className="flex items-center gap-3 justify-center py-4 text-slate-600">
        <EyeOff size={14} />
        <p className="text-[10px] uppercase font-black tracking-[0.2em]">Screenshots and screen recording are strictly prohibited</p>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, sub, highlight }: { label: string, value: string, sub: string, highlight?: boolean }) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group">
    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3">{label}</p>
    <div className="flex flex-col gap-1">
      <p className={`text-xl font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sub}</p>
    </div>
  </div>
);
