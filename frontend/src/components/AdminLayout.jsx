import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  Award,
  Users,
  UserCheck,
  Megaphone,
  Image,
  Sliders,
  Database,
  History,
  LogOut,
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  ChevronRight,
  FileCheck2,
  Brush
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'superadmin'] },
    { name: 'Categories', path: '/admin/categories', icon: FolderOpen, roles: ['admin', 'superadmin'] },
    { name: 'Events', path: '/admin/events', icon: Award, roles: ['admin', 'superadmin'] },
    { name: 'Units / Teams', path: '/admin/units', icon: UserCheck, roles: ['admin', 'superadmin'] },
    { name: 'Participants', path: '/admin/participants', icon: Users, roles: ['admin', 'superadmin'] },
    { name: 'Result Management', path: '/admin/results', icon: FileCheck2, roles: ['admin', 'superadmin'] },
    { name: 'Poster Templates', path: '/admin/posters', icon: Brush, roles: ['admin', 'superadmin'] },
    { name: 'Certificate Templates', path: '/admin/certificates', icon: Brush, roles: ['admin', 'superadmin'] },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone, roles: ['admin', 'superadmin'] },
    { name: 'Gallery Management', path: '/admin/gallery', icon: Image, roles: ['admin', 'superadmin'] },
    
    // Super Admin Only
    { name: 'Admin Users', path: '/admin/users', icon: Users, roles: ['superadmin'] },
    { name: 'System Settings', path: '/admin/settings', icon: Sliders, roles: ['superadmin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role));

  const isActivePath = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  if (user?.mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden bg-mesh w-full">
        <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none z-0"></div>
        <div className="z-10 w-full flex justify-center">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      {/* Background Mesh (fixed) */}
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none z-0"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/80 border-r border-white/5 backdrop-blur-md z-20 sticky top-0 h-screen select-none">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg glow-indigo">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">Sahithyolsav</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Portal Admin</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-300 font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">{user?.name}</p>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside
            className="w-64 bg-slate-900 border-r border-white/10 h-full flex flex-col z-50 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
                  S
                </div>
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">Sahithyolsav</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-none">{user?.name}</p>
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col z-10">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/40 border-b border-white/5 flex items-center justify-between px-6 z-20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/40"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Breadcrumb / Title */}
            <div className="flex items-center text-sm font-semibold text-slate-400">
              <span className="hidden sm:inline">Sahithyolsav</span>
              <ChevronRight className="w-4 h-4 mx-1.5 hidden sm:inline" />
              <span className="text-white capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-white/5 text-slate-300">
              {user?.role === 'superadmin' ? '⚡ Super Admin' : '🛡️ Admin'}
            </span>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
