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
  .post("/google", googleLoginController)
  .post("/logout", logoutController)
  .get("/status", passportAuthenticateJwt, authStatusController);

export default authRoutes;
