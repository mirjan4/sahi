import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import { Download, X, AlertCircle, Layers, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterRenderer from './PosterRenderer';

const ResultPosterModal = ({ result, isOpen, onClose }) => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const canvasRef = useRef(null);

  const fetchTemplate = async () => {
    setLoading(true);
    setError('');
    setTemplate(null);

    try {
      const res = await api.get('/posters/templates');
      if (res.data.success && res.data.templates.length > 0) {
        const defTemp = res.data.templates.find(t => t.isDefault) || res.data.templates[0];
        setTemplate(defTemp);
      } else {
        setError('No poster templates configured. Please upload a template in the admin settings first.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load poster template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && result) {
      fetchTemplate();
    }
  }, [isOpen, result]);

  const handleDownload = (format) => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const eventNameClean = (result.event?.name || 'result').replace(/\s+/g, '_');

    if (format === 'png') {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventNameClean}_official_poster.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;

      const orientation = width > height ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'px', [width, height]);
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${eventNameClean}_official_poster.pdf`);
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const title = `Official Event Result: ${result.event?.name}`;
    const text = `Check out the official result poster for ${result.event?.name} (${result.event?.category?.name})!`;
    const shareUrl = `${window.location.origin}/posters?search=${encodeURIComponent(result.event?.name)}`;

    try {
      if (navigator.share) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'result_poster.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title,
                  text,
                });
                return;
              } catch (err) {
                console.log('File share failed, falling back to URL share:', err);
              }
            }
          }
          await navigator.share({
            title,
            text,
            url: shareUrl,
          });
        }, 'image/png');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareNotice('Sharing link copied to clipboard!');
        setTimeout(() => setShareNotice(''), 3000);
      }
    } catch (err) {
      console.error('Share action failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-2xl w-full max-w-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between h-[85vh] text-left bg-slate-900"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-indigo-400" />
                Official Event Result Poster
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {result?.event?.name} - {result?.event?.category?.name}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 gap-2">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400 font-semibold">Generating Poster Canvas...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2 max-w-md">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!error && template && (
              <div className="glass-card p-2 rounded-xl border border-white/5 shadow-2xl max-w-full max-h-[50vh] overflow-hidden flex justify-center items-center">
                <PosterRenderer
                  template={template}
                  data={result}
                  canvasRef={canvasRef}
                  className="max-w-full max-h-[48vh] object-contain rounded-lg border border-white/5 bg-slate-950"
                />
              </div>
            )}
            
            {shareNotice && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 border border-emerald-500/20 text-white text-[10px] font-bold px-3.5 py-2 rounded-full shadow-2xl z-50 animate-bounce">
                {shareNotice}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-white/5 bg-slate-900 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleShare}
              disabled={loading || !!error || !template}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-indigo-400" /> Share
            </button>
            <button
              onClick={() => handleDownload('png')}
              disabled={loading || !!error || !template}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download PNG
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={loading || !!error || !template}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResultPosterModal;
