import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../api/types';
import { homeFor } from '../lib/format';
import { useAuth } from './AuthContext';

/**
 * UI-level route guard. This only improves the experience: the real enforcement is the backend, which
 * rejects any request the signed-in role is not allowed to make.
 */
export default function RequireRole({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-8 text-center text-stone-500">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}
