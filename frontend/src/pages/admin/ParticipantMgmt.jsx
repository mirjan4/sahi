import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Search,
  Users,
  Download,
  Upload,
  CheckCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Minus,
} from 'lucide-react';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';
import Swal from 'sweetalert2';

const ParticipantMgmt = () => {
  const [participants, setParticipants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isExportingSelected, setIsExportingSelected] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Excel Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch reference categories and units once
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [catRes, unitsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/units'),
        ]);
        if (catRes.data.success) setCategories(catRes.data.categories);
        if (unitsRes.data.success) setUnits(unitsRes.data.units);
      } catch (err) {
        console.error('Failed to load references', err);
      }
    };
    fetchReferences();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear selection when page/search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, debouncedSearch]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/participants', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setParticipants(res.data.participants);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load participants database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [page, limit, debouncedSearch]);

  const fetchData = () => {
    fetchParticipants();
  };

  // ── Bulk selection helpers ──────────────────────────────────────────────────

  const currentPageIds = participants.map((p) => p._id);
  const allCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentPageSelected =
    currentPageIds.some((id) => selectedIds.has(id)) && !allCurrentPageSelected;
  const selectedCount = selectedIds.size;

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    if (allCurrentPageSelected) {
      // Deselect all current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all current page (union with any already selected from other pages)
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Ctrl+A keyboard shortcut — selects all on current page
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !showForm && !showImportModal) {
        e.preventDefault();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          currentPageIds.forEach((id) => next.add(id));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPageIds, showForm, showImportModal]);

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    const result = await Swal.fire({
      title: '🗑 Delete Selected Participants?',
      html: `<span style="color:#94a3b8">${selectedCount} participant${selectedCount > 1 ? 's' : ''} will be permanently deleted.<br/>This action cannot be undone.</span>`,
      showCancelButton: true,
      confirmButtonText: `Delete ${selectedCount} Participant${selectedCount > 1 ? 's' : ''}`,
      cancelButtonText: 'Cancel',
      focusCancel: true,
      customClass: {
        popup: 'glass-swal-popup',
        title: 'glass-swal-title',
        htmlContainer: 'glass-swal-html',
        confirmButton: 'glass-swal-confirm-danger-btn',
        cancelButton: 'glass-swal-cancel-btn',
        actions: 'glass-swal-actions',
      },
      buttonsStyling: false,
      background: 'transparent',
    });

    if (!result.isConfirmed) return;

    setIsBulkDeleting(true);
    try {
      const res = await api.delete('/participants/bulk-delete', {
        data: { participantIds: Array.from(selectedIds) },
      });
      if (res.data.success) {
        clearSelection();
        showSuccess(`${res.data.deletedCount} Participant${res.data.deletedCount > 1 ? 's' : ''} Deleted Successfully`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showError('Bulk Delete Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedCount === 0) return;
    setIsExportingSelected(true);
    try {
      const res = await api.post(
        '/participants/excel/export-selected',
        { participantIds: Array.from(selectedIds) },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participants_selected_${selectedCount}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`${selectedCount} Participant${selectedCount > 1 ? 's' : ''} Exported`);
    } catch (err) {
      // Fallback: export all if endpoint doesn't exist yet
      console.warn('Export selected not available, falling back to full export.', err);
      api.get('/participants/excel/export', { responseType: 'blob' })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'participants.xlsx');
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch(console.error);
    } finally {
      setIsExportingSelected(false);
    }
  };

  // ── CRUD handlers (unchanged) ──────────────────────────────────────────────

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setRegisterNo('');
    setCategory(categories[0]?._id || '');
    setUnit(units[0]?._id || '');
    setEmail('');
    setPhone('');
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (p) => {
    setEditId(p._id);
    setName(p.name);
    setRegisterNo(p.registerNo);
    setCategory(p.category?._id || p.category || '');
    setUnit(p.unit?._id || p.unit || '');
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!name || !registerNo || !category || !unit) {
      setFormError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    const payload = { name, registerNo, category, unit, email, phone };

    try {
      if (editId) {
        const res = await api.put(`/participants/${editId}`, payload);
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Participant updated successfully.');
          fetchData();
        }
      } else {
        const res = await api.post('/participants', payload);
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Participant added successfully.');
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Action failed.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Participant?',
      'This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/participants/${id}`);
      if (res.data.success) {
        // Also remove from selection if selected
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showSuccess('Participant deleted successfully.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Delete failed.');
      showError('Delete Failed', err.response?.data?.message || 'Please try again.');
    }
  };

  const handleExport = () => {
    api.get('/participants/excel/export', { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'participants.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to export participants list.');
      });
  };

  const handleDownloadTemplate = () => {
    api.get('/participants/csv/template', { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'participants_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error(err);
        setFormError('Failed to download CSV template.');
      });
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setFormError('');
    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/participants/excel/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setImportResult(res.data.summary);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showSuccess('Import completed successfully.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Import failed.');
      showError('Import Failed', err.response?.data?.message || 'Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Participants</h1>
          <p className="text-slate-400 mt-1 font-medium">Add, edit, export, or bulk import contestants roster.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 border border-white/5 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setFormError(''); }}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 border border-white/5 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={openAddForm}
            disabled={categories.length === 0 || units.length === 0}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
            Register Student
          </button>
        </div>
      </div>

      {(categories.length === 0 || units.length === 0) && !loading && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm">
          Please register at least one <strong>Category</strong> and one <strong>Unit</strong> before adding participants.
        </div>
      )}

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
          placeholder="Search by name, register number, unit, category..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* ── Floating Bulk Action Bar ── */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.18)',
            }}
          >
            {/* Count badge */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <span className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              </span>
              <span className="text-sm font-bold text-white whitespace-nowrap">
                {selectedCount} Selected
              </span>
            </div>

            {/* Export Selected */}
            <button
              onClick={handleExportSelected}
              disabled={isExportingSelected}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all border border-white/5 disabled:opacity-50"
            >
              {isExportingSelected ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export Selected
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-all disabled:opacity-50"
            >
              {isBulkDeleting ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete Selected
            </button>

            {/* Clear */}
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all"
              title="Clear Selection"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : participants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  {/* Select All checkbox */}
                  <th className="pl-5 pr-2 py-4 w-10">
                    <button
                      onClick={toggleSelectAllPage}
                      className="flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Select all on this page (Ctrl+A)"
                    >
                      {allCurrentPageSelected ? (
                        <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
                      ) : someCurrentPageSelected ? (
                        <span className="w-4 h-4 rounded border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center">
                          <Minus className="w-2.5 h-2.5 text-indigo-400" />
                        </span>
                      ) : (
                        <Square className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Register No</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit / Team</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participants.map((p) => {
                  const isSelected = selectedIds.has(p._id);
                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/8 hover:bg-indigo-500/12'
                          : 'hover:bg-slate-900/20'
                      }`}
                      onClick={() => toggleRow(p._id)}
                    >
                      {/* Row checkbox */}
                      <td className="pl-5 pr-2 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRow(p._id)}
                          className="flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400 transition-colors" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border transition-colors ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {p.registerNo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white" onClick={(e) => e.stopPropagation()}>
                        {p.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-semibold" onClick={(e) => e.stopPropagation()}>
                        {p.category?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-400 font-bold" onClick={(e) => e.stopPropagation()}>
                        {p.unit?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400" onClick={(e) => e.stopPropagation()}>
                        <div>{p.email || '—'}</div>
                        <div>{p.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(p)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No participants found matching filters.</p>
          </div>
        )}
      </div>

      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg h-full bg-slate-900 border-l border-white/10 p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editId ? 'Edit Student Details' : 'Register New Student'}
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Participant Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul K"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Number *</label>
                    <input
                      type="text"
                      value={registerNo}
                      onChange={(e) => setRegisterNo(e.target.value)}
                      placeholder="e.g. REG1001"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm uppercase"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 font-medium text-sm"
                        required
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit / Team *</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 font-medium text-sm"
                        required
                      >
                        {units.map((u) => (
                          <option key={u._id} value={u._id}>{u.name} ({u.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contact Info (Optional)</h3>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                      />
                    </div>
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
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Save Details'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl w-full max-w-lg border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Bulk Import Participants (Excel / CSV)
                </h2>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {importResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm">File Imported Successfully!</h3>
                      <p className="text-xs text-emerald-400/80">
                        Processed: {importResult.created} created, {importResult.updated} updated, {importResult.failed} failed.
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-rose-400">Errors List ({importResult.errors.length}):</span>
                      <div className="max-h-32 overflow-y-auto p-3 bg-slate-950 border border-white/5 rounded-xl text-slate-400 text-xs font-mono space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx}>{err}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowImportModal(false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleImportSubmit} className="space-y-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload an Excel Spreadsheet (.xlsx, .xls) or a CSV file (.csv). Expected columns:
                    <span className="block font-semibold text-slate-300 mt-1">
                      Name, Register No, Category, Category Code (opt), Unit, Unit Code (opt), Email (opt), Phone (opt)
                    </span>
                    Missing categories or units will be <strong>automatically created</strong>.
                  </p>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Need a model template?</h4>
                      <p className="text-[11px] text-slate-400">Download our sample CSV with the required format.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold tracking-wide border border-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Template
                    </button>
                  </div>

                  <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center hover:border-indigo-500/40 transition-colors flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-2" />
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      ref={fileInputRef}
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="hidden"
                      id="excel-file-upload"
                      required
                    />
                    <label htmlFor="excel-file-upload" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer border border-white/5 transition-colors">
                      Choose Excel or CSV File
                    </label>
                    <span className="text-xs text-slate-400 font-medium mt-1">
                      {importFile ? importFile.name : 'No file chosen (Limit: 10MB)'}
                    </span>
                  </div>

                  <div className="flex gap-4 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isImporting || !importFile}
                      className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {isImporting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Upload & Import'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParticipantMgmt;
