import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, X, ExternalLink, Film } from 'lucide-react';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lightbox modal states
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get('/gallery');
        if (res.data.success) {
          setItems(res.data.gallery);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch gallery media highlights.');
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in relative text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Festival Media Highlights</h1>
        <p className="text-slate-400 mt-1">Recaps, photos, and highlight reels from events.</p>
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
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between group relative cursor-pointer hover:border-indigo-500/20 transition-all shadow-lg glow-indigo-hover"
            >
              <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                {item.mediaType === 'image' ? (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 p-4 text-center">
                    <Video className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-full">
                      {item.mediaUrl}
                    </span>
                  </div>
                )}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[9px] font-extrabold uppercase tracking-wide border border-white/5 flex items-center gap-1">
                  {item.mediaType === 'image' ? <ImageIcon className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                  {item.mediaType}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{item.title || 'Untitled Highlight'}</h3>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                  Published: {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm">No highlights uploaded yet.</p>
        </div>
      )}

      {/* Lightbox Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 border border-white/5 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl max-h-[80vh] overflow-hidden flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 p-1 glow-indigo shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.mediaType === 'image' ? (
                <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="max-w-full max-h-[75vh] object-contain rounded-xl" />
              ) : (
                <div className="w-[80vw] max-w-2xl aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center p-8 border border-white/5">
                  <Film className="w-16 h-16 text-indigo-400 mb-4" />
                  <h3 className="font-extrabold text-white text-md mb-2">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-400 max-w-md text-center mb-6 leading-relaxed">
                    This item links to an external recap broadcast video or clip folder. Click below to stream.
                  </p>
                  <a
                    href={selectedItem.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Video Stream
                  </a>
                </div>
              )}
            </motion.div>

            {selectedItem.mediaType === 'image' && (
              <div className="text-center mt-4 max-w-md">
                <h3 className="font-bold text-white text-sm">{selectedItem.title || 'Sahithyolsav Highlight'}</h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mt-1">
                  Published: {new Date(selectedItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
