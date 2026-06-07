import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Megaphone, FileText, ExternalLink, Search } from 'lucide-react';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const AnnouncementMgmt = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('news');
  const [isPublished, setIsPublished] = useState(true);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements', {
        params: {
          all: true,
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, limit, debouncedSearch]);

  const openAddForm = () => {
    setEditId(null);
    setTitle('');
    setContent('');
    setType('news');
    setIsPublished(true);
    setAttachmentFile(null);
    setAttachmentPreview('');
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (ann) => {
    setEditId(ann._id);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setIsPublished(ann.isPublished);
    setAttachmentFile(null);
    setAttachmentPreview(ann.attachment || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!title || !content) {
      setFormError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('type', type);
    formData.append('isPublished', String(isPublished));
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    try {
      if (editId) {
        const res = await api.put(`/announcements/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Announcement updated successfully.');
          fetchAnnouncements();
        }
      } else {
        const res = await api.post('/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Announcement published successfully.');
          fetchAnnouncements();
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save announcement.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Notice?',
      'Are you sure you want to delete this notice?'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        showSuccess('Notice deleted successfully.');
        fetchAnnouncements();
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Announcements</h1>
          <p className="text-slate-400 mt-1 font-medium">Publish festival circulars, bulletins, and event details.</p>
        </div>
        <button
          onClick={openAddForm}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
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
          placeholder="Search announcements by title, content or type..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* Announcements List */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">File Circular</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {announcements.map((ann) => (
                  <tr key={ann._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold whitespace-nowrap">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white max-w-xs truncate">{ann.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        ann.type === 'circular' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        ann.type === 'notification' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-pink-500/10 border-pink-500/20 text-pink-400'
                      }`}>
                        {ann.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300 font-semibold">
                      {ann.attachment ? (
                        <a
                          href={ann.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View File
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ann.isPublished ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ann.isPublished ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(ann)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann._id)}
                          className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Megaphone className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No notices published yet.</p>
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

      {/* Modal/Drawer Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-slate-900 border-l border-white/10 p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editId ? 'Edit Announcement' : 'Publish Announcement'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notice Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Schedule Updates for Senior Poetry"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      >
                        <option value="news">News Bulletin</option>
                        <option value="circular">Official Circular</option>
                        <option value="notification">Quick Notification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attach Document File</label>
                      <input
                        type="file"
                        onChange={(e) => setAttachmentFile(e.target.files[0])}
                        className="w-full text-xs text-slate-400 border border-white/5 p-2 rounded-lg bg-slate-950"
                      />
                      {attachmentPreview && !attachmentFile && (
                        <a href={attachmentPreview} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 underline mt-1 block">
                          Current: {attachmentPreview.split('/').pop()}
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Body Content *</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      placeholder="Write descriptive information regarding the schedule change or announcement..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      id="ann-publish-check"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="text-indigo-600 rounded border-white/10"
                    />
                    <label htmlFor="ann-publish-check" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                      Publish immediately (Visible on public notice board)
                    </label>
                  </div>
                </form>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Announcement'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementMgmt;
