import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { getUsersController, updateProfileController } from "../controllers/user.controller";

const userRoutes = Router()
  .use(passportAuthenticateJwt)
  .get("/all", getUsersController)
  .put("/profile", updateProfileController);

export default userRoutes;
