import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { FolderOpen, Award, User, Trophy, Download, Layers } from 'lucide-react';
import ResultPosterModal from '../components/ResultPosterModal';
import FilterBar from '../components/FilterBar';

// Medal config per position
const MEDAL = {
  1: {
    label: '1st',
    emoji: '🥇',
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    glow: 'shadow-amber-500/10',
    bar: 'bg-amber-500',
  },
  2: {
    label: '2nd',
    emoji: '🥈',
    badge: 'bg-slate-300/10 text-slate-300 border border-slate-400/20',
    glow: 'shadow-slate-400/10',
    bar: 'bg-slate-400',
  },
  3: {
    label: '3rd',
    emoji: '🥉',
    badge: 'bg-orange-700/15 text-orange-400 border border-orange-600/30',
    glow: 'shadow-orange-500/10',
    bar: 'bg-orange-500',
  },
};

const WinnerRow = ({ w, idx }) => {
  const medal = MEDAL[w.position] || {
    label: `#${w.position}`,
    emoji: '🎖️',
    badge: 'bg-slate-800 text-slate-400 border border-white/5',
    glow: '',
    bar: 'bg-indigo-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.06 }}
      className={`flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all group`}
    >
      {/* Position medal */}
      <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-base ${medal.badge} font-black`}>
        {medal.emoji}
      </div>

      {/* Name & unit */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${w.participant?.registerNo}`}
          className="text-xs font-bold text-white hover:text-indigo-400 transition-colors truncate block leading-tight"
        >
          {w.participant?.name || '—'}
        </Link>
        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide truncate block mt-0.5">
          {w.participant?.unit?.name || ''}
        </span>
      </div>

      {/* Grade / points badges */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {w.grade && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[8px] uppercase tracking-wide">
            {w.grade}
          </span>
        )}
        {w.points > 0 && (
          <span className="text-[9px] text-slate-500 font-semibold">{w.points} pts</span>
        )}
      </div>
    </motion.div>
  );
};

const ResultCard = ({ res, idx, onOpenPoster }) => {
  const top = res.winners?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="glass-card rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all duration-300 flex flex-col overflow-hidden shadow-xl hover:shadow-indigo-600/5 group"
    >
      {/* Card Header */}
      <div className="p-5 border-b border-white/5 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-indigo-400 uppercase tracking-[0.18em] font-extrabold block mb-1">
              {res.event?.category?.name || 'Category'}
            </span>
            <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors">
              {res.event?.name}
            </h3>
          </div>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide border ${
            res.event?.type === 'group'
              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          }`}>
            {res.event?.type === 'group' ? 'Group' : 'Solo'}
          </span>
        </div>

        {/* 1st place hero highlight */}
        {top && (
          <div className="mt-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] text-amber-300 font-bold truncate">
              {top.participant?.name}
            </span>
            <span className="text-[9px] text-slate-500 truncate">
              — {top.participant?.unit?.name}
            </span>
          </div>
        )}
      </div>

      {/* Winners list */}
      <div className="flex-1 p-4 space-y-2">
        {res.winners.length > 0 ? (
          res.winners.map((w, i) => (
            <WinnerRow key={i} w={w} idx={i} />
          ))
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">No winners recorded.</p>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-4 border-t border-white/5 bg-slate-950/40">
        <button
          onClick={() => onOpenPoster(res)}
          className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-indigo-600/5"
        >
          <Layers className="w-3.5 h-3.5" />
          View Poster
        </button>
      </div>
    </motion.div>
  );
};

const Results = () => {
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const handleOpenPoster = (res) => {
    setSelectedResult(res);
    setIsPosterOpen(true);
  };

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, catRes, eventsRes] = await Promise.all([
          api.get('/results'),
          api.get('/categories'),
          api.get('/events'),
        ]);

        if (resultsRes.data.success) setResults(resultsRes.data.results);
        if (catRes.data.success) setCategories(catRes.data.categories);
        if (eventsRes.data.success) setEvents(eventsRes.data.events);
      } catch (err) {
        console.error(err);
        setError('Failed to load results from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedEvent('');
  };

  // Filter events based on category selection
  const filteredEvents = selectedCategory
    ? events.filter((e) => (e.category?._id || e.category) === selectedCategory)
    : events;

  // Filter results
  const filteredResults = results.filter((res) => {
    if (selectedEvent && res.event?._id !== selectedEvent) return false;

    const resCatId = res.event?.category?._id || res.event?.category;
    if (selectedCategory && resCatId !== selectedCategory) return false;

    if (search) {
      const query = search.toLowerCase();
      const matchEvent = res.event?.name.toLowerCase().includes(query);
      const matchWinner = res.winners.some(
        (w) =>
          w.participant?.name.toLowerCase().includes(query) ||
          w.participant?.registerNo.toLowerCase().includes(query)
      );
      return matchEvent || matchWinner;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in relative text-left">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Award className="w-7 h-7 text-indigo-400" />
          Event Standings &amp; Results
        </h1>
        <p className="text-slate-400 mt-1">Browse literary awards, standings and winner details.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        events={events}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        onReset={handleReset}
      />

      {/* Results count badge */}
      {!loading && filteredResults.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">
            Showing <span className="text-indigo-400 font-bold">{filteredResults.length}</span> result{filteredResults.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-9 h-9 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResults.map((res, idx) => (
            <ResultCard
              key={res._id}
              res={res}
              idx={idx}
              onOpenPoster={handleOpenPoster}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 text-center py-16 text-slate-500 shadow-xl">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold">No matching results found.</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting the filters above.</p>
        </div>
      )}

      <ResultPosterModal
        result={selectedResult}
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
      />
    </div>
  );
};

export default Results;
