import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, FileCheck2, Calendar, Eye, EyeOff, PlusCircle, MinusCircle, Download } from 'lucide-react';
import ResultPosterModal from '../../components/ResultPosterModal';
import FilterBar from '../../components/FilterBar';
import SearchableSelect from '../../components/SearchableSelect';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, confirmPublish, showSuccess, showError } from '../../utils/swal';

const ResultMgmt = () => {
  const [results, setResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [winnerRows, setWinnerRows] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const [units, setUnits] = useState([]);

  // Quick Add Participant states
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddRowIndex, setQuickAddRowIndex] = useState(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddRegisterNo, setQuickAddRegisterNo] = useState('');
  const [quickAddUnit, setQuickAddUnit] = useState('');
  const [quickAddEmail, setQuickAddEmail] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);

  const handleOpenPoster = (res) => {
    setSelectedResult(res);
    setIsPosterOpen(true);
  };

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch reference events, participants, categories, units once
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [eventsRes, participantsRes, categoriesRes, unitsRes] = await Promise.all([
          api.get('/events'),
          api.get('/participants'),
          api.get('/categories'),
          api.get('/units'),
        ]);
        if (eventsRes.data.success) setEvents(eventsRes.data.events);
        if (participantsRes.data.success) setParticipants(participantsRes.data.participants);
        if (categoriesRes.data.success) setCategories(categoriesRes.data.categories);
        if (unitsRes.data.success) setUnits(unitsRes.data.units);
      } catch (err) {
        console.error('Failed to load reference details', err);
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

  // Reset page when category filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get('/results', {
        params: {
          all: 'true',
          page,
          limit,
          search: debouncedSearch,
          category: selectedCategory,
        },
      });
      if (res.data.success) {
        setResults(res.data.results);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load results database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, limit, debouncedSearch, selectedCategory]);

  const fetchData = () => {
    fetchResults();
  };

  // Close modal if selectedEventId is cleared
  useEffect(() => {
    if (!selectedEventId) {
      setShowForm(false);
    }
  }, [selectedEventId]);

  const openQuickAddModal = (index) => {
    setQuickAddRowIndex(index);
    setQuickAddName('');
    setQuickAddRegisterNo('');
    setQuickAddUnit(units[0]?._id || '');
    setQuickAddEmail('');
    setQuickAddPhone('');
    setQuickAddError('');
    setShowQuickAdd(true);
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    setQuickAddError('');
    setQuickAddSubmitting(true);

    if (!quickAddName || !quickAddRegisterNo || !quickAddUnit) {
      setQuickAddError('Please fill in all required fields.');
      setQuickAddSubmitting(false);
      return;
    }

    const selectedEvent = events.find((ev) => ev._id === selectedEventId);
    const eventCategory = selectedEvent?.category?._id || selectedEvent?.category;

    if (!eventCategory) {
      setQuickAddError('Invalid event category. Cannot register participant.');
      setQuickAddSubmitting(false);
      return;
    }

    const payload = {
      name: quickAddName,
      registerNo: quickAddRegisterNo.toUpperCase(),
      category: eventCategory,
      unit: quickAddUnit,
      email: quickAddEmail,
      phone: quickAddPhone,
    };

    try {
      const res = await api.post('/participants', payload);
      if (res.data.success) {
        // Update local participants list
        const newParticipant = res.data.participant;
        // Make sure it has unit populated for the dropdown display
        const matchedUnit = units.find(u => u._id === quickAddUnit);
        newParticipant.unit = matchedUnit ? { _id: matchedUnit._id, name: matchedUnit.name, code: matchedUnit.code } : quickAddUnit;
        
        setParticipants([...participants, newParticipant]);
        
        // Auto select this participant in the triggering row
        handleRowChange(quickAddRowIndex, 'participant', newParticipant._id);
        
        setShowQuickAdd(false);
      }
    } catch (err) {
      console.error(err);
      setQuickAddError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  const handleOpenEntryForm = () => {
    if (!selectedEventId) return;

    const existingResult = results.find(
      (r) => (r.event?._id || r.event) === selectedEventId
    );

    if (existingResult) {
      // Edit Mode
      setEditId(existingResult._id);
      setIsPublished(existingResult.isPublished || false);
      const rows = existingResult.winners.map((w) => ({
        participant: w.participant?._id || w.participant || '',
        position: w.position,
        grade: w.grade || '',
        points: w.points || '',
      }));
      setWinnerRows(rows.length > 0 ? rows : [
        { participant: '', position: 1, grade: '', points: '' },
        { participant: '', position: 2, grade: '', points: '' },
        { participant: '', position: 3, grade: '', points: '' }
      ]);
    } else {
      // Create Mode
      setEditId(null);
      setIsPublished(false);
      setWinnerRows([
        { participant: '', position: 1, grade: '', points: '' },
        { participant: '', position: 2, grade: '', points: '' },
        { participant: '', position: 3, grade: '', points: '' }
      ]);
    }
    setFormError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEventId('');
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedEventId('');
  };

  const openEditForm = (res) => {
    const event = res.event;
    if (event) {
      setSelectedCategory(event.category?._id || event.category || '');
      setSelectedEventId(event._id);
      setEditId(res._id);
      setIsPublished(res.isPublished || false);
      const rows = res.winners.map((w) => ({
        participant: w.participant?._id || w.participant || '',
        position: w.position,
        grade: w.grade || '',
        points: w.points || '',
      }));
      setWinnerRows(rows.length > 0 ? rows : [
        { participant: '', position: 1, grade: '', points: '' },
        { participant: '', position: 2, grade: '', points: '' },
        { participant: '', position: 3, grade: '', points: '' }
      ]);
      setFormError('');
      setShowForm(true);
    }
  };

  // Add a winner row
  const addWinnerRow = () => {
    setWinnerRows([...winnerRows, { participant: '', position: 0, grade: '', points: '' }]);
  };

  // Remove a winner row
  const removeWinnerRow = (index) => {
    const rows = [...winnerRows];
    rows.splice(index, 1);
    setWinnerRows(rows);
  };

  // Handle winner row inputs change
  const handleRowChange = (index, field, value) => {
    const rows = [...winnerRows];
    rows[index][field] = value;

    // Auto-calculate points if position or grade changes
    if (field === 'position' || field === 'grade') {
      const selectedEvent = events.find((e) => e._id === selectedEventId);
      if (selectedEvent) {
        let pts = 0;
        const pos = Number(rows[index].position);
        const gd = rows[index].grade;

        if (pos === 1) pts += selectedEvent.points?.first || 0;
        else if (pos === 2) pts += selectedEvent.points?.second || 0;
        else if (pos === 3) pts += selectedEvent.points?.third || 0;

        if (gd === 'A') pts += selectedEvent.points?.gradeA || 0;
        else if (gd === 'B') pts += selectedEvent.points?.gradeB || 0;
        else if (gd === 'C') pts += selectedEvent.points?.gradeC || 0;

        rows[index].points = pts;
      }
    }

    setWinnerRows(rows);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!selectedEventId) {
      setFormError('Please select an Category and Event first.');
      setIsSubmitting(false);
      return;
    }

    // Validate rows, skipping empty ones
    const cleanedWinners = [];
    for (const row of winnerRows) {
      if (!row.participant) {
        continue;
      }

      cleanedWinners.push({
        participant: row.participant,
        position: Number(row.position),
        grade: row.grade,
        points: row.points !== '' ? Number(row.points) : undefined,
      });
    }

    if (cleanedWinners.length === 0) {
      setFormError('Please select at least one winner.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      eventId: selectedEventId,
      winners: cleanedWinners,
      isPublished,
    };

    try {
      const res = await api.post('/results', payload);
      if (res.data.success) {
        setShowForm(false);
        setSelectedEventId('');
        setSelectedCategory('');
        showSuccess('Results saved successfully.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save results.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (id) => {
    const resultToToggle = results.find(r => r._id === id);
    if (resultToToggle && !resultToToggle.isPublished) {
      const confirmed = await confirmPublish();
      if (!confirmed) return;
    }

    try {
      const res = await api.put(`/results/${id}/publish`);
      if (res.data.success) {
        showSuccess(res.data.result.isPublished ? 'Result published successfully.' : 'Result moved to draft.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to toggle publish status.');
      showError('Action Failed', 'Failed to toggle publish status.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Result?',
      'This result and its scoring points will be removed.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/results/${id}`);
      if (res.data.success) {
        showSuccess('Result deleted successfully.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError('Delete failed.');
      showError('Delete Failed', 'Please try again.');
    }
  };

  // Filter participants to only those who match the selected event's category
  const getFilteredParticipantsForEvent = () => {
    const selectedEvent = events.find((e) => e._id === selectedEventId);
    if (!selectedEvent) return [];
    
    const catId = selectedEvent.category?._id || selectedEvent.category;
    return participants.filter((p) => {
      const pCatId = p.category?._id || p.category;
      return pCatId === catId;
    });
  };

  // Client side filtering removed in favor of server side pagination
  const displayResults = results;

  const activeParticipants = getFilteredParticipantsForEvent();

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Results Management</h1>
          <p className="text-slate-400 mt-1 font-medium">Record winners standings and manage scoring publications.</p>
        </div>
        <button
          onClick={handleOpenEntryForm}
          disabled={!selectedCategory || !selectedEventId}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Enter Results
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filter options bar (Search Participant, Category, Event) */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        events={events}
        selectedEvent={selectedEventId}
        setSelectedEvent={setSelectedEventId}
        onReset={handleReset}
        searchPlaceholder="Search results by participant or event..."
      />

      {/* Results grid */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : displayResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Winners Standings</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayResults.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      <div>{res.event?.name}</div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{res.event?.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-semibold">{res.event?.category?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 py-1">
                        {res.winners.map((w, index) => (
                          <div key={index} className="text-xs text-slate-300 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              w.position === 1 ? 'bg-amber-500/20 text-amber-300' :
                              w.position === 2 ? 'bg-slate-300/20 text-slate-300' :
                              w.position === 3 ? 'bg-amber-700/20 text-amber-500' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {w.position > 0 ? `#${w.position}` : 'Grade'}
                            </span>
                            <span className="font-bold text-white">{w.participant?.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">({w.participant?.unit?.name})</span>
                            {w.grade && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px]">
                                Grade {w.grade}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.isPublished ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                      }`}>
                        {res.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleTogglePublish(res._id)}
                          className={`p-2 rounded-lg transition-all ${
                            res.isPublished ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={res.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {res.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenPoster(res)}
                          className="p-2 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-all"
                          title="View Result Poster"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(res)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(res._id)}
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
            <FileCheck2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No results computed yet.</p>
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
              className="w-full max-w-2xl h-full bg-slate-900 border-l border-white/10 p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editId ? 'Modify Results' : 'Record Event Results'}
                  </h2>
                  <button onClick={handleCloseForm} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-xl border border-white/5 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Category</span>
                    <span className="text-sm font-bold text-white">
                      {events.find(e => e._id === selectedEventId)?.category?.name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Event</span>
                    <span className="text-sm font-bold text-white">
                      {events.find(e => e._id === selectedEventId)?.name || '—'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Winners roster dynamic block */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Winners Standings</h3>
                      <button
                        type="button"
                        onClick={addWinnerRow}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Row
                      </button>
                    </div>

                    {winnerRows.map((row, index) => (
                      <div key={index} className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3 relative">
                        {winnerRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWinnerRow(index)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <MinusCircle className="w-4.5 h-4.5" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {index === 0 ? '1st Place Winner' : index === 1 ? '2nd Place Winner' : index === 2 ? '3rd Place Winner' : `Winner #${index + 1}`} *
                              </label>
                              <button
                                type="button"
                                onClick={() => openQuickAddModal(index)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-all active:scale-[0.98]"
                              >
                                + Quick Add Student
                              </button>
                            </div>
                            <SearchableSelect
                              options={activeParticipants.map((p) => ({
                                value: p._id,
                                label: `${p.name} - ${p.registerNo} (${p.unit?.name || ''})`
                              }))}
                              value={row.participant}
                              onChange={(val) => handleRowChange(index, 'participant', val)}
                              placeholder="Search or Select Participant..."
                              required={index === 0}
                            />
                            {row.participant && (
                              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1.5">
                                <span>Sector:</span>
                                <span className="text-indigo-400 font-bold">
                                  {participants.find((p) => p._id === row.participant)?.unit?.name || '—'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Position</label>
                            <select
                              value={row.position}
                              onChange={(e) => handleRowChange(index, 'position', e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                            >
                              <option value={0}>None</option>
                              <option value={1}>1st Place</option>
                              <option value={2}>2nd Place</option>
                              <option value={3}>3rd Place</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-500 font-bold">Auto computed points:</span>
                          <input
                            type="number"
                            value={row.points}
                            onChange={(e) => handleRowChange(index, 'points', e.target.value)}
                            placeholder="Points"
                            className="bg-transparent text-right font-extrabold text-sm text-indigo-400 outline-none w-16 focus:border-b focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      id="publish-check"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="text-indigo-600 focus:ring-0 rounded border-white/10"
                    />
                    <label htmlFor="publish-check" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                      Publish results immediately (Visible on live scoreboard and results search)
                    </label>
                  </div>
                </form>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={handleCloseForm}
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
                    'Save Results'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Quick Add Participant Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl w-full max-w-md border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <h2 className="text-lg font-bold text-white">
                  Quick Register Student
                </h2>
                <button onClick={() => setShowQuickAdd(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {quickAddError && (
                <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{quickAddError}</span>
                </div>
              )}

              <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="e.g. Rahul K"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Number *</label>
                  <input
                    type="text"
                    value={quickAddRegisterNo}
                    onChange={(e) => setQuickAddRegisterNo(e.target.value)}
                    placeholder="e.g. REG1001"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium text-xs uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit / Team *</label>
                  <select
                    value={quickAddUnit}
                    onChange={(e) => setQuickAddUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 font-medium text-xs"
                    required
                  >
                    <option value="" disabled>Select Unit</option>
                    {units.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={quickAddEmail}
                      onChange={(e) => setQuickAddEmail(e.target.value)}
                      placeholder="email"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={quickAddPhone}
                      onChange={(e) => setQuickAddPhone(e.target.value)}
                      placeholder="phone"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickAddSubmitting}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                  >
                    {quickAddSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Save Student'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ResultPosterModal
        result={selectedResult}
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
      />
    </div>
  );
};

export default ResultMgmt;
