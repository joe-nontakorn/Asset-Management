// File: src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../../utils/auth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const valid = isTokenValid();

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
