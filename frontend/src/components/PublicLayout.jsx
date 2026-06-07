import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import api from '../utils/api';
import {
  Menu, X, Award, Search, Trophy, Megaphone,
  Image as ImageIcon, Sparkles, Home,
  BarChart2,
} from 'lucide-react';

const PublicLayout = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [festivalName, setFestivalName] = useState('Sahithyolsav 2026');

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.success) {
        setFestivalName(res.data.settings.festival_name || 'Sahithyolsav 2026');
        if (res.data.settings.theme_color) {
          document.documentElement.className = `theme-${res.data.settings.theme_color}`;
        }
      }
    }).catch(() => {});
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  /* ── Desktop nav links (full) ── */
  const desktopNav = [
    { name: 'Home',       path: '/',           icon: Home },
    { name: 'Results',    path: '/results',    icon: Search },
    { name: 'Scoreboard', path: '/scoreboard', icon: Trophy },
    { name: 'Notices',    path: '/notices',    icon: Megaphone },
    { name: 'Gallery',    path: '/gallery',    icon: ImageIcon },
    { name: 'Posters',    path: '/posters',    icon: Award },
  ];

  /* ── Mobile bottom tabs (primary 4 + more) ── */
  const bottomTabs = [
    { name: 'Home',       path: '/',           icon: Home },
    { name: 'Results',    path: '/results',    icon: Search },
    { name: 'Scoreboard', path: '/scoreboard', icon: Trophy },
    { name: 'Gallery',    path: '/gallery',    icon: ImageIcon },
  ];

  /* ── Drawer links (secondary) ── */
  const drawerLinks = [
    { name: 'Home',       path: '/',           icon: Home },
    { name: 'Results',    path: '/results',    icon: Search },
    { name: 'Scoreboard', path: '/scoreboard', icon: Trophy },
    { name: 'Notices',    path: '/notices',    icon: Megaphone },
    { name: 'Gallery',    path: '/gallery',    icon: ImageIcon },
    { name: 'Posters',    path: '/posters',    icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Global bg mesh */}
      <div className="fixed inset-0 bg-mesh opacity-55 pointer-events-none z-0" />

      {/* ╔══════════════════════════════════════╗
          ║   DESKTOP TOP NAVBAR (hidden mobile) ║
          ╚══════════════════════════════════════╝ */}
      <header
        className="hidden md:flex sticky top-0 z-40 items-center justify-between px-6 lg:px-10 h-14"
        style={{
          background: 'rgba(7,10,26,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 0 rgba(var(--theme-500),0.12)',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white transition-transform duration-200 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg,rgb(var(--theme-500)),rgb(var(--theme-700)))',
              boxShadow: '0 0 14px rgba(var(--theme-500),0.5)',
            }}
          >
            S
          </div>
          <div>
            <p className="text-xs font-black text-white tracking-tight leading-none">{festivalName}</p>
            <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest leading-tight">Literature &amp; Arts</p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="flex items-center gap-0.5">
          {desktopNav.map(({ name, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150"
                style={{
                  color: active ? 'rgb(var(--theme-400))' : '#64748b',
                  background: active ? 'rgba(var(--theme-500),0.10)' : 'transparent',
                  border: active ? '1px solid rgba(var(--theme-500),0.2)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Right side — menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg,rgb(var(--theme-500)),rgb(var(--theme-700)))',
              boxShadow: '0 0 14px rgba(var(--theme-500),0.45)',
            }}
          >
            <Menu className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </header>

      {/* ╔══════════════════════════════════════╗
          ║   MOBILE TOP MINI HEADER              ║
          ╚══════════════════════════════════════╝ */}
      <div
        className="md:hidden flex items-center justify-between px-4 h-12 flex-shrink-0 sticky top-0 z-40"
        style={{
          background: 'rgba(7,10,26,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: 'linear-gradient(135deg,rgb(var(--theme-500)),rgb(var(--theme-700)))', boxShadow: '0 0 10px rgba(var(--theme-500),0.4)' }}
          >
            S
          </div>
          <span className="text-xs font-black text-white tracking-tight">{festivalName}</span>
        </Link>
      </div>

      {/* ╔══════════════════════════════════════╗
          ║   BACKDROP                            ║
          ╚══════════════════════════════════════╝ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in"
          style={{ background: 'rgba(2,4,15,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ╔══════════════════════════════════════╗
          ║   COMPACT SLIDE-IN DRAWER             ║
          ╚══════════════════════════════════════╝ */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: '255px',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'rgba(7,10,26,0.98)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: drawerOpen ? '-8px 0 48px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Top neon accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(var(--theme-500),0.9) 40%,rgba(var(--theme-400),0.6) 70%,transparent)' }}
        />

        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">{festivalName}</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-3 pt-3 flex-1 overflow-y-auto">
          {drawerLinks.map(({ name, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150"
                style={{
                  background: active ? 'rgba(var(--theme-500),0.10)' : 'transparent',
                  border: active ? '1px solid rgba(var(--theme-500),0.22)' : '1px solid transparent',
                  color: active ? 'rgb(var(--theme-400))' : '#64748b',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#cbd5e1'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? 'rgba(var(--theme-500),0.18)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid rgba(var(--theme-500),0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Icon className="w-3 h-3" />
                </div>
                {name}
                {active && <div className="ml-auto w-1 h-1 rounded-full" style={{ background: 'rgb(var(--theme-400))', boxShadow: '0 0 5px rgb(var(--theme-400))' }} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ╔══════════════════════════════════════╗
          ║   PAGE CONTENT                        ║
          ╚══════════════════════════════════════╝ */}
      <main
        className={`flex-1 w-full z-10 pb-20 md:pb-0 ${
          location.pathname === '/'
            ? ''
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10'
        }`}
      >
        <Outlet />
      </main>

      {/* ╔══════════════════════════════════════╗
          ║   MOBILE FIXED BOTTOM TAB BAR        ║
          ╚══════════════════════════════════════╝ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          background: 'rgba(7,10,26,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          height: '60px',
        }}
      >
        {/* Top neon border line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(var(--theme-600),0.5) 30%,rgba(var(--theme-400),0.4) 70%,transparent)' }}
        />

        {/* Primary 4 tabs */}
        {bottomTabs.map(({ name, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150"
              style={{ color: active ? 'rgb(var(--theme-400))' : '#475569' }}
            >
              <div
                className="relative flex items-center justify-center w-8 h-7 rounded-xl transition-all duration-150"
                style={{
                  background: active ? 'rgba(var(--theme-500),0.12)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {active && (
                  <span
                    className="absolute -top-0.5 left-1/2 w-4 h-0.5 rounded-full"
                    style={{
                      transform: 'translateX(-50%)',
                      background: 'rgb(var(--theme-400))',
                      boxShadow: '0 0 8px rgb(var(--theme-400))',
                    }}
                  />
                )}
              </div>
              <span
                className="text-[8px] font-bold uppercase tracking-wider leading-none"
                style={{ color: active ? 'rgb(var(--theme-400))' : '#475569' }}
              >
                {name}
              </span>
            </Link>
          );
        })}

        {/* More / ☰ */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150"
          style={{ color: drawerOpen ? 'rgb(var(--theme-400))' : '#475569' }}
        >
          <div
            className="flex items-center justify-center w-8 h-7 rounded-xl transition-all duration-150"
            style={{ background: drawerOpen ? 'rgba(var(--theme-500),0.12)' : 'transparent' }}
          >
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wider leading-none">More</span>
        </button>
      </nav>

      {/* Footer (desktop only) */}
      <footer className="hidden md:block border-t border-white/5 bg-slate-950/60 py-5 text-center text-xs text-slate-600 z-10">
        <p>© {new Date().getFullYear()} {festivalName} · Result Management Platform</p>
      </footer>
    </div>
  );
};

export default PublicLayout;
