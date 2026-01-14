import { Router } from "express";
import {
  loginController,
  logoutController,
  registerController,
  authStatusController,
  googleLoginController,
} from "../controllers/auth.controller";
import { passportAuthenticateJwt } from "../config/passport.config";

const authRoutes = Router()
  .post("/register", registerController)
  .post("/login", loginController)
  .post("/google", (req, res, next) => {
    console.log('[Auth Route] POST /auth/google called');
    next();
  }, googleLoginController)
  .post("/logout", logoutController)
  .get("/status", passportAuthenticateJwt, authStatusController);

console.log('[Auth Routes] Registered routes:', ['POST /auth/register', 'POST /auth/login', 'POST /auth/google', 'POST /auth/logout', 'GET /auth/status']);

export default authRoutes;
