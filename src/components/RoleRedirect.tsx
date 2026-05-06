import { Navigate } from "react-router-dom";
import { FullPageLoader } from "./FullPageLoader";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/routes";

export function RoleRedirect() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPath(role)} replace />;
}
