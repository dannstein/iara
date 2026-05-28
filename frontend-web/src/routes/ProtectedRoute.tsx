import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, hasRole } from '@/store/authStore';
import type { Role } from '@/types/api';

interface ProtectedRouteProps {
  minRole?: Role;
}

export function ProtectedRoute({ minRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (minRole && !hasRole(user?.role, minRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
