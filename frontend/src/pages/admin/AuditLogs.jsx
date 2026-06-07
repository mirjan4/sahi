import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { History, ShieldAlert, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/system/audit-logs?page=${pageNum}&limit=20`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setPage(res.data.page);
        setTotalPages(res.data.pages);
        setTotalLogs(res.data.total);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchLogs(newPage);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Audit Trail Logs</h1>
        <p className="text-slate-400 mt-1">Immutable records of administrative and security events (Super Admin only).</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-semibold whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} - {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div>{log.user.name}</div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">{log.user.role}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-[9px] uppercase tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{log.details}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/5 bg-slate-900/20 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">
                  Showing page {page} of {totalPages} ({totalLogs} records)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <History className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No activity records logged.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
