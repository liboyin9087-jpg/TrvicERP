// =====================================================
// TravelCanvas - App Router (Production-ready skeleton)
// - Role-based routes
// - Auth via Supabase (if configured) or demo-mode fallback
// - Vercel SPA rewrites supported (vercel.json)
// =====================================================

import { Navigate, Route, Routes } from 'react-router-dom';

import AgencyDashboard from './pages/agency/AgencyDashboard';
import CommitteeDashboard from './pages/committee/CommitteeDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import LoginPage from './pages/LoginPage';
import AttractionsList from './pages/AttractionsList';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import type { Role } from './types';

function roleHome(role: Role | undefined) {
  if (role === 'ADMIN' || role === 'BOSS') return '/agency';
  if (role === 'CLIENT' || role === 'HR') return '/committee';
  return '/employee';
}

export default function App() {
  const { auth, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/agency/*"
        element={
          <ProtectedRoute allow={['ADMIN', 'BOSS']}>
            <AgencyDashboard onLogout={() => void logout()} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/*"
        element={
          <ProtectedRoute allow={['CLIENT', 'HR']}>
            <CommitteeDashboard onLogout={() => void logout()} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allow={['EMPLOYEE']}>
            <EmployeeDashboard onLogout={() => void logout()} voterId={auth.user?.id} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attractions"
        element={
          <ProtectedRoute allow={['ADMIN', 'BOSS', 'CLIENT', 'HR', 'EMPLOYEE']}>
            <AttractionsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={auth.isAuthenticated ? <Navigate to={roleHome(auth.user?.role)} replace /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
