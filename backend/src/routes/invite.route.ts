import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { createInviteController, getMyInvitesController, respondToInviteController } from "../controllers/invite.controller";

const inviteRouter = Router();

inviteRouter.use(passportAuthenticateJwt);

inviteRouter.post("/", createInviteController);
inviteRouter.get("/", getMyInvitesController);
inviteRouter.post("/:id/respond", respondToInviteController);

export default inviteRouter;
