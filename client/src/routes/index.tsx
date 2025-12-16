import BaseLayout from "@/layouts/base-layout";
import { Route, Routes } from "react-router-dom";
import { authRoutesPaths, protectedRoutesPaths, PROTECTED_ROUTES } from "./routes";
import AppLayout from "@/layouts/app-layout";
import RouteGuard from "./route-guard";
import AcceptInvitePage from "@/pages/accept-invite";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<BaseLayout />}>
        <Route path={PROTECTED_ROUTES.ACCEPT_INVITE} element={<AcceptInvitePage />} />
        <Route path={PROTECTED_ROUTES.JOIN} element={<AcceptInvitePage />} />
      </Route>
      {/* Protected routes with AppLayout - Must come first to match before auth routes */}
      <Route element={<RouteGuard requireAuth={true} />}>
        <Route element={<AppLayout />}>
          {protectedRoutesPaths?.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      {/* Auth / Public routes */}
      <Route element={<RouteGuard requireAuth={false} />}>
        <Route element={<BaseLayout />}>
          {authRoutesPaths?.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
