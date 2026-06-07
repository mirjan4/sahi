import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, AlertCircle, Image as ImageIcon, Video, Film, Search } from 'lucide-react';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const GalleryMgmt = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(''); // for YouTube embeds
  const [preview, setPreview] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12); // default 12 items for grid
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGallery = async () => {
    try {
      const res = await api.get('/gallery', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setGallery(res.data.gallery);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load gallery items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [page, limit, debouncedSearch]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddForm = () => {
    setTitle('');
    setMediaType('image');
    setMediaFile(null);
    setMediaUrl('');
    setPreview('');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (mediaType === 'image' && !mediaFile && !mediaUrl) {
      setFormError('Please upload an image file or provide a URL.');
      setIsSubmitting(false);
      return;
    }

    if (mediaType === 'video' && !mediaUrl && !mediaFile) {
      setFormError('Please enter a Video URL (e.g. YouTube Link) or upload a video file.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('mediaType', mediaType);
    if (mediaFile) {
      formData.append('media', mediaFile);
    } else if (mediaUrl) {
      formData.append('mediaUrl', mediaUrl);
    }

    try {
      const res = await api.post('/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setShowForm(false);
        showSuccess('Media highlight saved successfully.');
        fetchGallery();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save gallery item.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Media?',
      'Are you sure you want to delete this media item?'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/gallery/${id}`);
      if (res.data.success) {
        showSuccess('Media item deleted successfully.');
        fetchGallery();
      }
    } catch (err) {
      console.error(err);
      setError('Delete failed.');
      showError('Delete Failed', 'Please try again.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Gallery Management</h1>
          <p className="text-slate-400 mt-1 font-medium">Upload photo highlights and link event recap videos.</p>
        </div>
        <button
          onClick={openAddForm}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Media
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gallery by description title..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : gallery.length > 0 ? (
          gallery.map((item) => (
            <div key={item._id} className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between group relative">
              <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                {item.mediaType === 'image' ? (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-b border-white/5 p-4 text-center">
                    <Video className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-full">
                      {item.mediaUrl}
                    </span>
                  </div>
                )}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[9px] font-extrabold uppercase tracking-wide border border-white/5 flex items-center gap-1">
                  {item.mediaType === 'image' ? <ImageIcon className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                  {item.mediaType}
                </span>
                
                {/* Delete button overlay on hover */}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-3 right-3 p-2 bg-rose-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 border border-rose-600 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-bold text-white truncate">{item.title || 'Untitled Highlight'}</h3>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Added: {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No highlights uploaded to gallery yet.</p>
          </div>
        )}
      </div>

      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setPage(1); setLimit(l); }}
      />

      {/* Upload Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl w-full max-w-md border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                  Upload Gallery Highlight
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Media Description Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Inauguration Dance Performance"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Media Type</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  >
                    <option value="image">Photo Image</option>
                    <option value="video">Video URL / Link</option>
                  </select>
                </div>

                {mediaType === 'image' ? (
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Image Asset</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-400 border border-white/5 p-2 rounded-lg bg-slate-950"
                      required={!mediaUrl}
                    />
                    
                    <div className="text-[10px] text-slate-400 font-bold text-center">OR PROVIDE IMAGE URL</div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    />

                    {preview && (
                      <div className="aspect-video rounded-xl bg-slate-950 border border-white/5 relative overflow-hidden flex items-center justify-center p-2">
                        <img src={preview} alt="Selected preview" className="max-w-full max-h-full object-contain rounded" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Video Embed URL (YouTube/Vimeo) *</label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                      required
                    />
                    <span className="text-[9px] text-slate-500 mt-1 block leading-tight">
                      For videos, we support streaming links or embedded platforms.
                    </span>
                  </div>
                )}

                <div className="flex gap-4 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Save Highlight'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryMgmt;
