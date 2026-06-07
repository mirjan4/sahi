import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, AlertCircle, Users, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const AdminUserMgmt = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/auth/admins');
      if (res.data.success) {
        setAdmins(res.data.admins);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load administrator accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAddForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('admin');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!name || !email || !password) {
      setFormError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data.success) {
        setShowForm(false);
        showSuccess('Administrator account created successfully.');
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to create user.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      const res = await api.put(`/auth/admins/${admin._id}/status`, {
        isActive: !admin.isActive,
      });
      if (res.data.success) {
        showSuccess(`Account ${!admin.isActive ? 'activated' : 'suspended'} successfully.`);
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update active status.');
      showError('Status Update Failed', 'Please try again.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Admin User?',
      'They will lose access to all panel operations immediately.'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/auth/admins/${id}`);
      if (res.data.success) {
        showSuccess('Administrator deleted successfully.');
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete user.');
      showError('Delete Failed', err.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Admin Users</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage and register administrative accounts (Super Admin only).</p>
        </div>
        <button
          onClick={openAddForm}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Admin
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Admins List */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : admins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Active Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-white">{adm.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-300">{adm.email}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        adm.role === 'superadmin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-white/5 text-slate-400'
                      }`}>
                        {adm.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleStatus(adm)}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {adm.isActive ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                            <ToggleRight className="w-6 h-6 text-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold flex items-center gap-1.5 text-xs">
                            <ToggleLeft className="w-6 h-6 text-slate-600" /> Suspended
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {adm.role !== 'superadmin' ? (
                        <button
                          onClick={() => handleDelete(adm._id)}
                          className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600 px-2 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No administrators found.</p>
          </div>
        )}
      </div>

      {/* Modal Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl w-full max-w-md border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                  Create Admin Account
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Adhil K"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sahithyolsav.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  >
                    <option value="admin">Regular Admin</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Save Account'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserMgmt;
