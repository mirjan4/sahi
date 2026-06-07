import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const FilterBar = ({
  search,
  setSearch,
  categories,
  selectedCategory,
  setSelectedCategory,
  events,
  selectedEvent,
  setSelectedEvent,
  onReset,
  searchPlaceholder = "Search by participant name, registration no, event name..."
}) => {
  const filteredEvents = selectedCategory
    ? events.filter((e) => {
        const catId = e.category?._id || e.category;
        const matchesCategory = catId === selectedCategory;
        const matchesSearch = search
          ? e.name.toLowerCase().includes(search.toLowerCase())
          : true;
        return matchesCategory && matchesSearch;
      })
    : [];

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Box */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            id="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedEvent(''); // reset selected event on category change
            }}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
          >
            <option value="">-- Choose Category --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Event Dropdown */}
        <div>
          <select
            id="filter-event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            disabled={!selectedCategory}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <option value="">-- Choose Event --</option>
            {filteredEvents.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onReset}
          id="filter-clear"
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
