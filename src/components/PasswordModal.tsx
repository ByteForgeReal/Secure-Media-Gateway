import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export const PasswordModal = ({ onSubmit, error, isLoading }: { onSubmit: (p: string) => void, error: string | null, isLoading: boolean }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-md w-full mx-auto relative px-4"
    >
      <div className="glass-card p-10 md:p-12 relative overflow-hidden">
        {/* Animated Background Shield */}
        <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 pointer-events-none">
          <ShieldCheck size={240} />
        </div>
        
        <div className="text-center space-y-4 mb-10 relative z-10">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{t('unlock')}</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            {t('privateResource')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('password')}</label>
            <div className="relative">
              <input 
                autoFocus
                type="password" 
                placeholder="••••••••"
                className={`input-field pr-12 h-14 ${error ? 'border-red-500/50' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <div className="absolute right-5 top-4.5 text-emerald-500/30">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs font-bold ml-1 flex items-center gap-2"
            >
              <AlertCircle size={14} /> {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading || !password}
            className="btn-primary w-full py-4 group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Gateway</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center mt-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
        End-to-End Encrypted Tunnel • TLS 1.3
      </p>
    </motion.div>
  );
};
