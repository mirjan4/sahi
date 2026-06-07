import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, CheckCircle, Sliders, UploadCloud, X, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    festival_name: 'Sahithyolsav 2026',
    festival_theme: 'Explore the Colors of Literature',
    theme_color: 'indigo',
    is_live: 'true',
    festival_banner: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Multi-image hero state
  const [heroBanners, setHeroBanners] = useState([]); // uploaded URLs
  const [stagedFiles, setStagedFiles] = useState([]);  // File objects staged for upload
  const [stagedPreviews, setStagedPreviews] = useState([]); // object URLs for preview
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroMsg, setHeroMsg] = useState({ type: '', text: '' });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
          if (res.data.settings.theme_color) {
            document.documentElement.className = `theme-${res.data.settings.theme_color}`;
          }
          // Load multi-banners
          if (res.data.settings.festival_banners) {
            try {
              const parsed = JSON.parse(res.data.settings.festival_banners);
              setHeroBanners(Array.isArray(parsed) ? parsed : []);
            } catch { setHeroBanners([]); }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { festival_banner, festival_banners, ...rest } = settings;
      const res = await api.post('/settings', rest);
      if (res.data.success) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
        if (res.data.settings.theme_color) {
          document.documentElement.className = `theme-${res.data.settings.theme_color}`;
        }
        setSuccess('System settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Stage new files for upload ──────────────────────────────────────────
  const stageFiles = (files) => {
    const valid = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) return false;
      if (f.size > 10 * 1024 * 1024) return false;
      return true;
    });
    if (valid.length === 0) {
      setHeroMsg({ type: 'error', text: 'Only image files under 10 MB are allowed.' });
      return;
    }
    setHeroMsg({ type: '', text: '' });
    setStagedFiles((prev) => [...prev, ...valid]);
    setStagedPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const removeStagedFile = (idx) => {
    URL.revokeObjectURL(stagedPreviews[idx]);
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
    setStagedPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Upload all staged files ─────────────────────────────────────────────
  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;
    setHeroUploading(true);
    setHeroMsg({ type: '', text: '' });
    try {
      const formData = new FormData();
      stagedFiles.forEach((f) => formData.append('hero_images', f));
      const res = await api.post('/settings/hero-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setHeroBanners(res.data.urls);
        stagedPreviews.forEach((url) => URL.revokeObjectURL(url));
        setStagedFiles([]);
        setStagedPreviews([]);
        setHeroMsg({ type: 'success', text: `${res.data.urls.length - heroBanners.length + stagedFiles.length > 0 ? stagedFiles.length : ''} image(s) uploaded! Slideshow updated.` });
        setTimeout(() => setHeroMsg({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      setHeroMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setHeroUploading(false);
    }
  };

  // ── Delete an uploaded banner by index ─────────────────────────────────
  const handleDeleteBanner = async (idx) => {
    try {
      const res = await api.delete(`/settings/hero-image/${idx}`);
      if (res.data.success) setHeroBanners(res.data.urls);
    } catch (err) {
      setHeroMsg({ type: 'error', text: 'Failed to remove image.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">System Settings</h1>
        <p className="text-slate-400 mt-1">Configure global platform details and championship parameters.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Hero Images Multi-Upload Card ─────────────────────────── */}
      <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-5">
        <h2 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          Homepage Hero Images
          {heroBanners.length > 0 && (
            <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {heroBanners.length} uploaded
            </span>
          )}
        </h2>

        <p className="text-xs text-slate-400">
          Upload multiple images that auto-rotate as a slideshow on the public homepage hero.
          Recommended: <span className="text-slate-300 font-semibold">1920 × 1080 px</span>. Max 10 MB each.
        </p>

        {/* Feedback */}
        <AnimatePresence>
          {heroMsg.text && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                heroMsg.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              }`}
            >
              {heroMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {heroMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Uploaded banners grid ── */}
        {heroBanners.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Uploaded Slideshow Images</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heroBanners.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio: '16/9' }}>
                  <img src={url} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDeleteBanner(idx)}
                      className="w-8 h-8 rounded-full bg-rose-600/90 hover:bg-rose-500 flex items-center justify-center transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-slate-950/80 text-[9px] text-slate-300 font-black flex items-center justify-center">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Staged (not yet uploaded) previews ── */}
        {stagedPreviews.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 mb-2">Staged — Not Uploaded Yet</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stagedPreviews.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-amber-500/20" style={{ aspectRatio: '16/9' }}>
                  <img src={url} alt={`Staged ${idx + 1}`} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeStagedFile(idx)}
                      className="w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-500 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500/90 text-[8px] text-white font-black rounded">STAGED</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Drag and drop zone ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); stageFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 h-32 flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-cyan-500 bg-cyan-500/5'
              : 'border-white/10 hover:border-white/20 bg-slate-950/30 hover:bg-slate-950/50'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500">
            <Plus className="w-4 h-4" />
            <ImageIcon className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {dragOver ? 'Drop images here' : 'Click or drag images to add'}
          </p>
          <p className="text-[10px] text-slate-600">PNG, JPG, WEBP · up to 10 MB each · multiple allowed</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => stageFiles(e.target.files)}
        />

        {/* ── Upload button ── */}
        {stagedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              <span className="font-bold text-white">{stagedFiles.length}</span> image{stagedFiles.length > 1 ? 's' : ''} ready to upload
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { stagedPreviews.forEach((u) => URL.revokeObjectURL(u)); setStagedFiles([]); setStagedPreviews([]); }}
                className="px-3 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={heroUploading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
              >
                {heroUploading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Upload {stagedFiles.length} Image{stagedFiles.length > 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>


      {/* ── General Settings Form ──────────────────────────── */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-white/5 p-6 space-y-6">
        <h2 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <Sliders className="w-4.5 h-4.5 text-indigo-400" />
          General Platform Options
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Festival Name</label>
            <input
              type="text"
              value={settings.festival_name || ''}
              onChange={(e) => handleChange('festival_name', e.target.value)}
              placeholder="e.g. Sahithyolsav 2026"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-medium text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Festival Theme / Slogan</label>
            <input
              type="text"
              value={settings.festival_theme || ''}
              onChange={(e) => handleChange('festival_theme', e.target.value)}
              placeholder="e.g. Express the Colors of Art"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Festival Date</label>
            <input
              type="text"
              value={settings.festival_date || ''}
              onChange={(e) => handleChange('festival_date', e.target.value)}
              placeholder="e.g. 2025 May 22, 23"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Festival Venue</label>
            <input
              type="text"
              value={settings.festival_venue || ''}
              onChange={(e) => handleChange('festival_venue', e.target.value)}
              placeholder="e.g. Kuttipadam, Kerala"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-medium text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Color Theme</label>
              <select
                value={settings.theme_color || 'indigo'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
              >
                <option value="indigo">Royal Indigo</option>
                <option value="violet">Deep Violet</option>
                <option value="pink">Vibrant Pink</option>
                <option value="emerald">Forest Emerald</option>
                <option value="amber">Warm Amber</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Status Portal</label>
              <select
                value={settings.is_live || 'true'}
                onChange={(e) => handleChange('is_live', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
              >
                <option value="true">Live (Scoreboard visible and updating)</option>
                <option value="false">Paused / Inactive (Portal maintenance)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Scheduled Events</label>
              <input
                type="number"
                value={settings.total_events || '135'}
                onChange={(e) => handleChange('total_events', e.target.value)}
                placeholder="e.g. 135"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Final Status Force Override</label>
              <select
                value={settings.final_status_override || 'false'}
                onChange={(e) => handleChange('final_status_override', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
              >
                <option value="false">Automatic (Trigger when all results published)</option>
                <option value="true">Force Final Status (Enable Champion Podium cards)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
