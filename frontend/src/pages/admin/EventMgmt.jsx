import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import PaginationBar from '../../components/PaginationBar';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, Award } from 'lucide-react';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const EventMgmt = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('single');
  
  // Point scale configs
  const [first, setFirst] = useState(5);
  const [second, setSecond] = useState(3);
  const [third, setThird] = useState(1);
  const [gradeA, setGradeA] = useState(5);
  const [gradeB, setGradeB] = useState(3);
  const [gradeC, setGradeC] = useState(1);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reference categories once
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data.success) setCategories(catRes.data.categories);
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

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setEvents(res.data.events);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load events data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, limit, debouncedSearch]);

  const fetchData = () => {
    fetchEvents();
  };

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setCode('');
    setCategory(categories[0]?._id || '');
    setType('single');
    setFirst(5);
    setSecond(3);
    setThird(1);
    setGradeA(5);
    setGradeB(3);
    setGradeC(1);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    setEditId(ev._id);
    setName(ev.name);
    setCode(ev.code);
    setCategory(ev.category?._id || ev.category || '');
    setType(ev.type || 'single');
    setFirst(ev.points?.first ?? 5);
    setSecond(ev.points?.second ?? 3);
    setThird(ev.points?.third ?? 1);
    setGradeA(ev.points?.gradeA ?? 5);
    setGradeB(ev.points?.gradeB ?? 3);
    setGradeC(ev.points?.gradeC ?? 1);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!name || !code || !category) {
      setFormError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name,
      code,
      category,
      type,
      points: {
        first: Number(first),
        second: Number(second),
        third: Number(third),
        gradeA: Number(gradeA),
        gradeB: Number(gradeB),
        gradeC: Number(gradeC),
      },
    };

    try {
      if (editId) {
        const res = await api.put(`/events/${editId}`, payload);
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Event updated successfully.');
          fetchData();
        }
      } else {
        const res = await api.post('/events', payload);
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Event created successfully.');
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
      'Delete Event?',
      'This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) {
        showSuccess('Event deleted successfully.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Delete failed.');
      showError('Delete Failed', err.response?.data?.message || 'Please try again.');
    }
  };

  // Client side filtering removed in favor of server side pagination
  const displayEvents = events;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Events</h1>
          <p className="text-slate-400 mt-1 font-medium">Create and customize event groups, types, and scoring points.</p>
        </div>
        <button
          onClick={openAddForm}
          disabled={categories.length === 0}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm">
          Please register at least one **Category** first before creating events.
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
          placeholder="Search events by name, code, category..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* Table grid */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : displayEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Event Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayEvents.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-extrabold uppercase">
                        {ev.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{ev.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-semibold">{ev.category?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ev.type === 'group' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(ev)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev._id)}
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
            <Award className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No events found matching filters.</p>
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

      {/* Modal/Drawer Form Overlay */}
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
                    {editId ? 'Edit Event' : 'Add New Event'}
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Malayalam Recitation"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Code</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. MALREC"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                        required
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="type"
                            value="single"
                            checked={type === 'single'}
                            onChange={() => setType('single')}
                            className="text-indigo-600 focus:ring-0"
                          />
                          Single Participant
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="type"
                            value="group"
                            checked={type === 'group'}
                            onChange={() => setType('group')}
                            className="text-indigo-600 focus:ring-0"
                          />
                          Group / Team Event
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Scoring configuration hidden to avoid clutter */}
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
                    'Save Event'
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

export default EventMgmt;
