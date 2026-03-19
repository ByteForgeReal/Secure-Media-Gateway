import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Activity, ExternalLink, Trash2, ArrowUpRight, ShieldCheck, Server, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Compute live stats from DB
  const totalLinks = links.length;
  const totalViews = links.reduce((sum, link) => sum + (link.views || 0), 0);
  const totalMaxViews = links.reduce((sum, link) => sum + (link.max_views || 0), 0);
  const viewPercentage = totalMaxViews > 0 ? ((totalViews / totalMaxViews) * 100).toFixed(1) : 0;
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this link?')) return;
    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete linkage.');
    }
  };

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) console.error(error);
      else setLinks(data || []);
      setLoading(false);
    };
    fetchLinks();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto space-y-10 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">{t('admin')}</h2>
          <p className="text-slate-500 font-medium">Monitor and manage all active secure links</p>
        </div>
        <div className="flex gap-4">
          <div className="px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('systemHealthy')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Links" value={totalLinks.toString()} trend="Active" />
        <StatCard title="Total Views" value={totalViews.toString()} trend="Tracked" color="blue" />
        <StatCard title="Engagement" value={`${viewPercentage}%`} trend="Safe" color={Number(viewPercentage) > 50 ? 'emerald' : 'blue'} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="font-black text-white flex items-center gap-3 text-lg">
            <ShieldCheck size={22} className="text-emerald-500" /> 
            {t('activeLinks')}
          </h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            View All History
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/20 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-8 py-5">{t('mediaName')}</th>
                <th className="px-8 py-5">{t('views')}</th>
                <th className="px-8 py-5">{t('expiry')}</th>
                <th className="px-8 py-5">{t('status')}</th>
                <th className="px-8 py-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-6 text-center text-slate-500">Loading secure links...</td></tr>
              ) : links.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-6 text-center text-slate-500">No active links found.</td></tr>
              ) : links.map((link) => {
                const isExpired = new Date() > new Date(link.expiry_time);
                const status = isExpired ? 'Expired' : 'Active';
                return (
                <tr key={link.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white mb-0.5">{link.media_name || 'Unnamed Link'}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">ID: {link.id.split('-')[0]}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">{link.views} / {link.max_views}</span>
                        <span className="text-emerald-500">{Math.round((link.views / link.max_views) * 100) || 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${(link.views / link.max_views) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-400 font-medium">
                    {new Date(link.expiry_time).toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                      ${status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(link.id)}
                        className="p-2.5 bg-slate-800/50 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, trend, color }: { title: string, value: string, trend: string, color?: string }) => (
  <div className="glass-card p-8 group hover:border-white/10 transition-all">
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{title}</p>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${color === 'emerald' ? 'text-emerald-400' : 'text-slate-500'}`}>
        {trend} {trend !== 'Live' && <ArrowUpRight size={10} />}
      </div>
    </div>
    <p className={`text-4xl font-black tracking-tighter ${color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
  </div>
);
