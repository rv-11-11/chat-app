import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";

interface Props {
  requireAuth?: boolean;
}

const RouteGuard = ({ requireAuth }: Props) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  // If route requires auth and user is not logged in, redirect to login
  if (requireAuth && !user) return <Navigate to="/sign-in" replace />;

  // If route is for non-auth users (login/signup) and user is logged in, redirect
  // Respect the redirect query param if present, otherwise go to home
  if (!requireAuth && user) {
    const destination = redirect || "/";
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default RouteGuard;
