import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Activity, ExternalLink, Trash2, ArrowUpRight, ShieldCheck, Server, Link as LinkIcon, Radio, MapPin, Tablet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const [links, setLinks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Compute live stats from DB
  const totalLinks = links.length;
  const totalViews = links.reduce((sum, link) => sum + (link.views || 0), 0);
  const totalMaxViews = links.reduce((sum, link) => sum + (link.max_views || 0), 0);
  const viewPercentage = totalMaxViews > 0 ? ((totalViews / totalMaxViews) * 100).toFixed(1) : 0;
  
  const handleSelfDestruct = async () => {
    if (!confirm('🚨 WARNING: This will permanently DELETE ALL secure links and wipe the database. Continue?')) return;
    try {
      const { error } = await supabase.from('links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setLinks([]);
      setLogs([]);
      alert('GLOBAL SELF-DESTRUCT COMPLETE. ALL DATA WIPED.');
    } catch (e) {
      console.error(e);
      alert('Self-destruct failed.');
    }
  };

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
    const fetchData = async () => {
      const [linksRes, logsRes] = await Promise.all([
        supabase.from('links').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*, links(media_name)').order('accessed_at', { ascending: false }).limit(10)
      ]);
      
      if (linksRes.data) setLinks(linksRes.data);
      if (logsRes.data) setLogs(logsRes.data);
      setLoading(false);
    };
    fetchData();
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
          <button 
            onClick={handleSelfDestruct}
            className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <Radio size={14} className="animate-pulse" />
            Global Self-Destruct
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-black text-white flex items-center gap-3 text-lg">
              <ShieldCheck size={22} className="text-emerald-500" /> 
              {t('activeLinks')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/20 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                  <th className="px-8 py-5">{t('mediaName')}</th>
                  <th className="px-8 py-5">AI Shield</th>
                  <th className="px-8 py-5">{t('status')}</th>
                  <th className="px-8 py-5 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {links.map((link) => {
                  const isExpired = new Date() > new Date(link.expiry_time);
                  const status = isExpired ? 'Expired' : 'Active';
                  return (
                  <tr key={link.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white mb-0.5">{link.media_name || 'Unnamed Link'}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-emerald-500/50 font-mono uppercase tracking-tighter">ID: {link.id.split('-')[0]}</span>
                          {link.custom_watermark && <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1"><Tablet size={8}/> {link.custom_watermark}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[200px] truncate">
                        <span className="text-[10px] text-slate-400 italic">"{link.ai_summary || 'No scan available'}"</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(link.id)}
                        className="p-2.5 bg-slate-800/50 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5">
            <h3 className="font-black text-white flex items-center gap-3 text-lg">
              <Activity size={22} className="text-blue-500" /> 
              Live Audit Log
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex items-start justify-between group hover:border-blue-500/20 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{log.viewer_ip}</span>
                    <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest bg-blue-500/10 px-1.5 rounded">Access</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">To: {log.links?.media_name || 'Deleted Link'}</p>
                  <p className="text-[9px] text-slate-600 flex items-center gap-1 uppercase tracking-tighter">
                    <MapPin size={8} /> 
                    {new Date(log.accessed_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg text-slate-600 group-hover:text-blue-400 transition-colors">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            ))}
          </div>
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
