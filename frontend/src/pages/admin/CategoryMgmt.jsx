import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, FolderOpen } from 'lucide-react';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const CategoryMgmt = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setCategories(res.data.categories);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, limit, debouncedSearch]);

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setCode('');
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditId(cat._id);
    setName(cat.name);
    setCode(cat.code);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!name || !code) {
      setFormError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editId) {
        const res = await api.put(`/categories/${editId}`, { name, code });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Category updated successfully.');
          fetchCategories();
        }
      } else {
        const res = await api.post('/categories', { name, code });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Category created successfully.');
          fetchCategories();
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
      'Delete Category?',
      'This will delete all associated participant categories.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data.success) {
        showSuccess('Category deleted successfully.');
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Delete failed.');
      showError('Delete Failed', err.response?.data?.message || 'Please try again.');
    }
  };

  const displayCategories = categories;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Categories</h1>
          <p className="text-slate-400 mt-1 font-medium">Define age groups or categories for competition rounds.</p>
        </div>
        <button
          onClick={openAddForm}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Category
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
          placeholder="Search categories by name or code..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* Table grid */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : displayCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold uppercase">
                        {cat.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{cat.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(cat)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
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
            <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No categories found matching filters.</p>
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
              className="w-full max-w-md h-full bg-slate-900 border-l border-white/10 p-8 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editId ? 'Edit Category' : 'Add New Category'}
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Senior Class"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. SNR"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm uppercase"
                      required
                    />
                  </div>
                </form>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-4">
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
                    'Save Category'
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

export default CategoryMgmt;
