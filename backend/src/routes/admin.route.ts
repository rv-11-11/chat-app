import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  isAdmin,
  isModerator,
  checkNotSuspended,
} from "../middlewares/admin.middleware";
import {
  getDashboardStatsController,
  getAllUsersController,
  suspendUserController,
  unsuspendUserController,
  deleteUserController,
  getReportsController,
  resolveReportController,
  dismissReportController,
  getChatAnalyticsController,
  createReportController,
  getUserReportsController,
} from "../controllers/admin.controller";

const adminRoutes = Router();

// Report routes (protected, all users can create reports)
adminRoutes.post(
  "/report/create",
  passportAuthenticateJwt,
  checkNotSuspended,
  createReportController
);
adminRoutes.get(
  "/report/my",
  passportAuthenticateJwt,
  checkNotSuspended,
  getUserReportsController
);

// Moderator routes
adminRoutes.get(
  "/reports",
  passportAuthenticateJwt,
  isModerator,
  getReportsController
);
adminRoutes.post(
  "/reports/:reportId/resolve",
  passportAuthenticateJwt,
  isModerator,
  resolveReportController
);
adminRoutes.post(
  "/reports/:reportId/dismiss",
  passportAuthenticateJwt,
  isModerator,
  dismissReportController
);
adminRoutes.get(
  "/analytics",
  passportAuthenticateJwt,
  isModerator,
  getChatAnalyticsController
);

// Admin-only routes
adminRoutes.get(
  "/stats",
  passportAuthenticateJwt,
  isAdmin,
  getDashboardStatsController
);
adminRoutes.get(
  "/users",
  passportAuthenticateJwt,
  isAdmin,
  getAllUsersController
);
adminRoutes.post(
  "/users/:userId/suspend",
  passportAuthenticateJwt,
  isAdmin,
  suspendUserController
);
adminRoutes.post(
  "/users/:userId/unsuspend",
  passportAuthenticateJwt,
  isAdmin,
  unsuspendUserController
);
adminRoutes.delete(
  "/users/:userId",
  passportAuthenticateJwt,
  isAdmin,
  deleteUserController
);

export default adminRoutes;
