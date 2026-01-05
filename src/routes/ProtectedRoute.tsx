import React from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { auth } = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  const role = auth.user?.role;
  if (!role || !allow.includes(role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
