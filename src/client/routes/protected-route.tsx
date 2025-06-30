import { Navigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
    const userRole = useUserStore((state) => state.accountType);
  if (!userRole) return <Navigate to={redirectTo} replace />;
  if (!allowedRoles.includes(userRole)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
