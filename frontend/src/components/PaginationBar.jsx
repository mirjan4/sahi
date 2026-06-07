import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationBar = ({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  onLimitChange
}) => {
  if (totalRecords === 0 || totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 mt-4 bg-slate-900/40 border border-white/5 rounded-2xl">
      {/* Left side: showing X-Y of Z / page size selector */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 text-xs font-semibold text-slate-400 w-full sm:w-auto">
        <span className="hidden sm:inline">
          Showing <span className="text-white">{startRecord}</span>-
          <span className="text-white">{endRecord}</span> of{' '}
          <span className="text-white">{totalRecords.toLocaleString()}</span> records
        </span>
        <span className="sm:hidden text-center w-full mb-1">
          Page <span className="text-white">{currentPage}</span> of{' '}
          <span className="text-white">{totalPages}</span> · Total:{' '}
          <span className="text-white">{totalRecords.toLocaleString()}</span> records
        </span>
        
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded bg-slate-950 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side: Page numbers and Prev/Next */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Desktop pages list */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2.5 py-1.5 text-slate-500 font-bold">
                  ...
                </span>
              );
            }
            const active = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`w-8.5 h-8.5 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                  active
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'border border-white/5 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all active:scale-95"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;
