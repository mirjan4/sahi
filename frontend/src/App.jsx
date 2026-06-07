import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import api from './utils/api';

// Layout wrappers
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Results from './pages/Results';
import Scoreboard from './pages/Scoreboard';
import Announcements from './pages/Announcements';
import Gallery from './pages/Gallery';
import PosterDownload from './pages/PosterDownload';
import ParticipantProfile from './pages/ParticipantProfile';
import Login from './pages/Login';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import CategoryMgmt from './pages/admin/CategoryMgmt';
import EventMgmt from './pages/admin/EventMgmt';
import UnitMgmt from './pages/admin/UnitMgmt';
import ParticipantMgmt from './pages/admin/ParticipantMgmt';
import ResultMgmt from './pages/admin/ResultMgmt';
import PosterTemplateMgmt from './pages/admin/PosterTemplateMgmt';
import PosterGenerator from './pages/admin/PosterGenerator';
import CertificateTemplateMgmt from './pages/admin/CertificateTemplateMgmt';
import CertificateGenerator from './pages/admin/CertificateGenerator';
import AnnouncementMgmt from './pages/admin/AnnouncementMgmt';
import GalleryMgmt from './pages/admin/GalleryMgmt';

// Super Admin pages
import AdminUserMgmt from './pages/admin/AdminUserMgmt';
import Settings from './pages/admin/Settings';
import BackupRestore from './pages/admin/BackupRestore';
import AuditLogs from './pages/admin/AuditLogs';
import ChangePassword from './pages/admin/ChangePassword';

function App() {
  React.useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data.success && res.data.settings?.theme_color) {
          document.documentElement.className = `theme-${res.data.settings.theme_color}`;
        }
      })
      .catch((err) => console.error('Failed to load global theme:', err));
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Portal Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="results" element={<Results />} />
            <Route path="scoreboard" element={<Scoreboard />} />
            <Route path="notices" element={<Announcements />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="posters" element={<PosterDownload />} />
            <Route path="profile/:regNo" element={<ParticipantProfile />} />
          </Route>

          {/* Secure Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin & Super Admin Protected Dashboard Area */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<CategoryMgmt />} />
            <Route path="events" element={<EventMgmt />} />
            <Route path="units" element={<UnitMgmt />} />
            <Route path="participants" element={<ParticipantMgmt />} />
            <Route path="results" element={<ResultMgmt />} />
            
            {/* Poster views */}
            <Route path="posters" element={<PosterTemplateMgmt />} />
            <Route path="posters/generate" element={<PosterGenerator />} />
            
            {/* Certificate views */}
            <Route path="certificates" element={<CertificateTemplateMgmt />} />
            <Route path="certificates/generate" element={<CertificateGenerator />} />
            
            <Route path="announcements" element={<AnnouncementMgmt />} />
            <Route path="gallery" element={<GalleryMgmt />} />
            <Route path="change-password" element={<ChangePassword />} />

            {/* Super Admin Restricted Area */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <AdminUserMgmt />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="backup-restore"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <BackupRestore />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Page Fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
