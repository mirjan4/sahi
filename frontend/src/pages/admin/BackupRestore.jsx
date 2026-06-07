import React, { useState } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { Database, Download, Upload, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';
import { confirmBackup, confirmRestore, showSuccess, showError } from '../../utils/swal';

const BackupRestore = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  const handleBackup = async () => {
    const confirmed = await confirmBackup();
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setProcessing(true);

    api.get('/system/backup', { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sahithyolsav_backup_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSuccess('Database backup generated successfully!');
        setSuccess('Database backup generated and downloaded successfully!');
        setProcessing(false);
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to generate database backup file.');
        showError('Backup Failed', 'Failed to generate database backup file.');
        setProcessing(false);
      });
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) return;

    const confirmed = await confirmRestore();
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setProcessing(true);

    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      const res = await api.post('/system/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        showSuccess('Database successfully restored!');
        setSuccess('Database successfully restored to backup state!');
        setRestoreFile(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Database restoration failed. Check backup JSON integrity.');
      showError('Restore Failed', err.response?.data?.message || 'Database restoration failed. Check backup JSON integrity.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Backup & Restore</h1>
        <p className="text-slate-400 mt-1">Export database backups or restore system states via JSON sheets.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Backup widget */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4.5 h-4.5 text-indigo-400" /> Export Database Backup
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate and download a localized `.json` backup file containing your users, units, events, results, and templates database records.
          </p>
          <button
            onClick={handleBackup}
            disabled={processing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Database className="w-4 h-4" /> Download Backup JSON
          </button>
        </div>

        {/* Restore widget */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <Upload className="w-4.5 h-4.5 text-rose-400" /> Restore Database State
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Caution: Uploading a restoration JSON will wipe all existing entries from Mongoose and overwrite data.
          </p>

          <form onSubmit={handleRestoreSubmit} className="space-y-4">
            <div className="p-6 border-2 border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-2">
              <FileJson className="w-8 h-8 text-slate-600 mb-1" />
              <input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                className="hidden"
                id="db-restore-upload"
                required
              />
              <label htmlFor="db-restore-upload" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-white/5 transition-colors">
                Choose Backup File
              </label>
              <span className="text-[11px] text-slate-400">
                {restoreFile ? restoreFile.name : 'No file chosen'}
              </span>
            </div>

            <button
              type="submit"
              disabled={processing || !restoreFile}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Database className="w-4 h-4" /> Restore Database Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
