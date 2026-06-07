import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Megaphone, FileText, Download, ExternalLink, Calendar } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements'); // GET matches published active items only
        if (res.data.success) {
          setAnnouncements(res.data.announcements);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load notices.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in relative text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Official Notice Board</h1>
        <p className="text-slate-400 mt-1">Circulars, bulletins, news bulletins, and schedule releases.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          {announcements.map((ann, idx) => (
            <motion.article
              key={ann._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="glass-card rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start gap-6 shadow-xl"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    ann.type === 'circular' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    ann.type === 'notification' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                    'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                  }`}>
                    {ann.type}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{ann.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>

              {ann.attachment && (
                <a
                  href={ann.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center gap-1.5 self-stretch justify-center md:self-start shrink-0"
                >
                  <ExternalLink className="w-4 h-4" /> Download File
                </a>
              )}
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Megaphone className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm">No bulletins posted at this time.</p>
        </div>
      )}
    </div>
  );
};

export default Announcements;
