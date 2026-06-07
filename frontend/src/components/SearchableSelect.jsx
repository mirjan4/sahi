import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Search or Select Participant...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicked outside of the dropdown container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus on the input search field automatically when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      setHighlightedIndex(0);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Accessibility keyboard handler
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        e.preventDefault();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      {/* Selection Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold select-none text-left"
      >
        <span className={selectedOption ? "text-white truncate" : "text-slate-500 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      {/* HTML constraint validation fallback */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          required
        />
      )}

      {/* Dropdown Options List Panel */}
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-60">
          <div className="p-2 border-b border-white/5 relative flex items-center bg-slate-950">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Search..."
              className="w-full pl-8 pr-8 py-2 rounded-lg bg-slate-900 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 py-1 max-h-48 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all block ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-extrabold'
                        : isHighlighted
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 text-center font-semibold">
                No matching participants found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
