import React, { useState, useEffect } from 'react';
import { UploadForm } from './components/UploadForm';
import { Viewer } from './components/Viewer';
import { AdminDashboard } from './components/AdminDashboard';
import { PasswordModal } from './components/PasswordModal';
import { Login } from './components/Login';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Shield, Lock, FileText, LayoutDashboard, Languages, ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function AppContent({ session }: { session: any }) {
  const urlParams = new URLSearchParams(window.location.search);
  const initialLink = urlParams.get('view');
  const initialKey = urlParams.get('key');
  
  const [view, setView] = useState<'upload' | 'viewer' | 'admin' | 'unlock'>(initialLink ? 'unlock' : 'upload');
  const [activeLinkId, setActiveLinkId] = useState<string | null>(initialLink);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<{ type: 'image' | 'video' | 'pdf' | 'url'; url: string } | null>(null);
  const [activeWatermark, setActiveWatermark] = useState<string>('');

  const { lang, setLang, t } = useLanguage();

  const handleUnlock = async (pwd: string) => {
    if (!activeLinkId) return;
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('id', activeLinkId)
        .eq('password', pwd)
        .single();

      if (error || !data) throw new Error('Invalid or expired link');
      
      const now = new Date();
      if (new Date(data.expiry_time) < now) throw new Error('Link has expired');
      if (data.views >= data.max_views) throw new Error('Max view limit reached');

      await supabase
        .from('links')
        .update({ views: data.views + 1 })
        .eq('id', activeLinkId);

      // Audit Logging
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();
        await supabase.from('audit_logs').insert([{
          link_id: activeLinkId,
          viewer_ip: ip,
          viewer_user_agent: navigator.userAgent
        }]);
      } catch (e) {
        console.warn('Audit logging failed (IP track blocked)');
      }

      if (data.media_type === 'url') {
         setMediaInfo({ type: 'url', url: data.file_path });
      } else {
         const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.file_path);
         setMediaInfo({ type: data.media_type as any, url: publicUrl });
      }
      
      const defaultWatermark = `SECURE_GATEWAY | ${session?.user?.email || 'GUEST'} | ${new Date().toLocaleDateString()}`;
      setActiveWatermark(data.custom_watermark || defaultWatermark);
      setView('viewer');
    } catch (err: any) {
      setUnlockError(err.message);
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    if (initialLink) {
      // Obscure the URL immediately so they can't copy the secret link from the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (initialKey && view === 'unlock') {
        try {
          const decodedPwd = atob(initialKey);
          handleUnlock(decodedPwd);
        } catch (e) {
          console.error('Invalid auto-unlock key');
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header / Navbar */}
      <header className="border-b border-white/5 bg-slate-950/20 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { window.location.href = '/'; }}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-widest text-lg uppercase leading-none">Gateway</span>
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em]">Secure Link</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-3 md:gap-6">
            <nav className="flex items-center gap-1 p-1 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl scale-[0.85] md:scale-100 origin-right">
              <NavButton active={view === 'upload'} onClick={() => { setActiveLinkId(null); setView('upload'); }} icon={<Lock size={14} />} label={t('upload')} />
              <NavButton active={view === 'unlock' || view === 'viewer'} onClick={() => setView(mediaInfo ? 'viewer' : 'unlock')} icon={<FileText size={14} />} label={t('preview')} />
              <NavButton active={view === 'admin'} onClick={() => setView('admin')} icon={<LayoutDashboard size={14} />} label={t('admin')} />
            </nav>

            <button 
              onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
              className="px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl hidden md:flex"
            >
              <Languages size={14} className="text-emerald-500" />
              {lang === 'en' ? 'HEBREW' : 'ENGLISH'}
            </button>

            {/* User Profile Tag */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {session?.user?.user_metadata?.avatar_url && (
                <img 
                  src={session.user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-white/10"
                />
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                  Verified Uploader
                </span>
              </div>

              <button 
                onClick={() => supabase.auth.signOut()}
                className="ml-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all border border-red-500/20 shadow-lg"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-16 px-6 relative">
        <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
            >
              {view === 'upload' && <UploadForm />}
              {view === 'unlock' && (
                <PasswordModal 
                  onSubmit={handleUnlock} 
                  error={unlockError} 
                  isLoading={isUnlocking} 
                />
              )}
              {view === 'viewer' && mediaInfo && (
                <Viewer 
                  type={mediaInfo.type as any} 
                  url={mediaInfo.url} 
                  watermark={activeWatermark}
                />
              )}
              {view === 'admin' && <AdminDashboard />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950/10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Shield size={12} />
            <div className="h-px w-8 bg-slate-800" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">
              Military Grade Security Protocol
            </p>
            <div className="h-px w-8 bg-slate-800" />
            <Shield size={12} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Gateway v2.0.4 • © 2026 Secure Media Link
          </p>
        </div>
      </footer>
    </div>
  )
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5
      ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <LanguageProvider>
      {session ? <AppContent session={session} /> : <Login />}
    </LanguageProvider>
  );
}
