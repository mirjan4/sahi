import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(location.state?.from?.pathname || '/admin');
    }

    // Check if redirect due to expired session
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      setExpiredMsg(true);
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExpiredMsg(false);
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate(location.state?.from?.pathname || '/admin');
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden bg-mesh p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow delay-300"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20 glow-indigo">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Secure Admin Login
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sahithyolsav Result Management Platform
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-white/10 glow-indigo-hover">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {expiredMsg && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Your login session has expired. Please log in again.</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sahithyolsav.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Back to Public Home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
          >
            ← Return to Public Portal
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
