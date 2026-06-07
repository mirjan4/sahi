import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Search, FolderOpen, Award, Download, RefreshCw } from 'lucide-react';
import ResultPosterModal from '../components/ResultPosterModal';
import FilterBar from '../components/FilterBar';

const PosterDownload = () => {
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  // Handle search query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, []);

  // Modal states
  const [selectedResult, setSelectedResult] = useState(null);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, catRes, eventsRes] = await Promise.all([
          api.get('/results'), // Public GET fetches only published results
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

  const handleOpenPoster = (res) => {
    setSelectedResult(res);
    setIsPosterOpen(true);
  };

  // Filter events based on category selection
  const filteredEvents = selectedCategory
    ? events.filter((e) => (e.category?._id || e.category) === selectedCategory)
    : events;

  // Filter results based on category, event, or name/reg searches
  const filteredResults = results.filter((res) => {
    if (selectedEvent && res.event?._id !== selectedEvent) {
      return false;
    }
    
    const resCatId = res.event?.category?._id || res.event?.category;
    if (selectedCategory && resCatId !== selectedCategory) {
      return false;
    }

    if (search) {
      const query = search.toLowerCase();
      const matchEvent = res.event?.name.toLowerCase().includes(query);
      const matchWinner = res.winners.some((w) =>
        w.participant?.name.toLowerCase().includes(query) ||
        w.participant?.registerNo.toLowerCase().includes(query)
      );
      return matchEvent || matchWinner;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Award className="w-8 h-8 text-indigo-400" />
          Official Result Posters
        </h1>
        <p className="text-slate-400 mt-1">Download high-quality PDF & PNG result posters for all Sahithyolsav events.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filter Options Widget */}
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

      {/* Results grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredResults.map((res) => (
            <div
              key={res._id}
              className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300"
            >
              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold block mb-1">
                    {res.event?.category?.name || 'Category'}
                  </span>
                  <h3 className="text-md font-bold text-white line-clamp-1">{res.event?.name}</h3>
                </div>

                {/* Minimalist Top 3 List */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {res.winners.map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          w.position === 1 ? 'bg-amber-500/20 text-amber-300' :
                          w.position === 2 ? 'bg-slate-300/20 text-slate-300' :
                          'bg-amber-700/20 text-amber-500'
                        }`}>
                          {w.position}st
                        </span>
                        <span className="font-bold text-slate-300 truncate">{w.participant?.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{w.participant?.unit?.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-4 bg-slate-900/40 border-t border-white/5">
                <button
                  onClick={() => handleOpenPoster(res)}
                  className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-indigo-600/5"
                >
                  <Download className="w-4 h-4" /> Download Poster
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 text-center py-12 text-slate-500 shadow-xl">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm">No published results found.</p>
        </div>
      )}

      {/* Shared Generator Modal */}
      <ResultPosterModal
        result={selectedResult}
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
      />
    </div>
  );
};

export default PosterDownload;
