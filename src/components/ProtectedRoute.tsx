import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullPageLoader } from "./FullPageLoader";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/database";
import { getDashboardPath } from "../utils/routes";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
