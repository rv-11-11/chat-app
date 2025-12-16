import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not admin, redirect to home
    if (!user?.isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Only render children if user is admin
  if (!user?.isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
