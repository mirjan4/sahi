import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, Trophy, Save, CheckCircle } from 'lucide-react';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, confirmCustom, showSuccess, showError } from '../../utils/swal';

const UnitMgmt = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'standings'

  // Roster CRUD states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [points, setPoints] = useState(0);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Standings states
  const [standingsList, setStandingsList] = useState([]);
  const [savingStandings, setSavingStandings] = useState(false);
  const [standingsError, setStandingsError] = useState('');
  const [standingsSuccess, setStandingsSuccess] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Standings allUnits state
  const [allUnitsForStandings, setAllUnitsForStandings] = useState([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setUnits(res.data.units);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load units.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [page, limit, debouncedSearch]);

  const fetchAllUnits = async () => {
    try {
      const res = await api.get('/units');
      if (res.data.success) {
        setAllUnitsForStandings(res.data.units);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'standings') {
      fetchAllUnits();
    }
  }, [activeTab]);

  useEffect(() => {
    if (allUnitsForStandings.length > 0) {
      setStandingsList(
        allUnitsForStandings.map((u) => ({
          teamId: u._id,
          name: u.name,
          code: u.code,
          totalPoints: u.points || 0,
        }))
      );
    }
  }, [allUnitsForStandings]);

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setCode('');
    setPoints(0);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (unit) => {
    setEditId(unit._id);
    setName(unit.name);
    setCode(unit.code);
    setPoints(unit.points);
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
        const res = await api.put(`/units/${editId}`, { name, code, points });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Unit updated successfully.');
          fetchUnits();
        }
      } else {
        const res = await api.post('/units', { name, code });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Unit created successfully.');
          fetchUnits();
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
      'Delete Unit?',
      'All registered participants under this unit will need reassignment.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/units/${id}`);
      if (res.data.success) {
        showSuccess('Unit deleted successfully.');
        fetchUnits();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Delete failed.');
      showError('Delete Failed', err.response?.data?.message || 'Please try again.');
    }
  };

  const handleStandingPointChange = (teamId, val) => {
    setStandingsList(
      standingsList.map((item) =>
        item.teamId === teamId ? { ...item, totalPoints: Number(val) } : item
      )
    );
  };

  const handleSaveStandings = async () => {
    const confirmed = await confirmCustom(
      'Save Standings?',
      'This will overwrite points standings for all teams.',
      'Save Standings'
    );
    if (!confirmed) return;

    setSavingStandings(true);
    setStandingsError('');
    setStandingsSuccess('');

    try {
      const res = await api.put('/units/standings', { standings: standingsList });
      if (res.data.success) {
        showSuccess('Team points standings saved successfully!');
        fetchAllUnits();
      }
    } catch (err) {
      console.error(err);
      setStandingsError(err.response?.data?.message || 'Failed to save standings.');
      showError('Save Failed', 'Failed to save points standings.');
    } finally {
      setSavingStandings(false);
    }
  };

  // Client side filtering removed in favor of server side pagination
  const displayUnits = units;

  return (
    <div className="space-y-8 animate-fade-in relative text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Championship Standings</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage sectors and record manual total points standings.</p>
        </div>
        {activeTab === 'roster' && (
          <button
            onClick={openAddForm}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Unit / Team
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'roster' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
          }`}
        >
          Teams Roster
          {activeTab === 'roster' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'standings' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
          }`}
        >
          Points Standings Editor
          {activeTab === 'standings' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'roster' ? (
        <>
          {/* Search Bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units by name or code..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          {/* Table grid */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : displayUnits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Code</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Points</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayUnits.map((unit) => (
                      <tr key={unit._id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase">
                            {unit.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{unit.name}</td>
                        <td className="px-6 py-4 text-sm font-extrabold text-indigo-400">{unit.points} pts</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditForm(unit)}
                              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit._id)}
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
                <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm">No units found matching filters.</p>
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
        </>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {standingsError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5" />
              <span>{standingsError}</span>
            </div>
          )}

          {standingsSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>{standingsSuccess}</span>
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Enter Sector Total Points
            </h2>

            <div className="divide-y divide-white/5">
              {standingsList.map((standing) => (
                <div key={standing.teamId} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-white block">{standing.name}</span>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">{standing.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={standing.totalPoints}
                      onChange={(e) => handleStandingPointChange(standing.teamId, e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg bg-slate-950 border border-white/5 text-white font-extrabold text-sm text-right focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">Points</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={handleSaveStandings}
                disabled={savingStandings || standingsList.length === 0}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingStandings ? 'Saving...' : 'Save Standings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal/Drawer Form Overlay for adding units */}
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
                    {editId ? 'Edit Unit' : 'Add New Unit'}
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Blue House / Zone A"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. ZA"
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
                    'Save Unit'
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

export default UnitMgmt;
