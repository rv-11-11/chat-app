import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  createChannelController,
  getPublicChannelsController,
  getUserChannelsController,
  subscribeToChannelController,
  unsubscribeFromChannelController,
  promoteToAdminController,
  demoteAdminController,
  getChannelInfoController,
  markChannelAsReadController,
  updateChannelController,
  deleteChannelController,
  getChannelInviteInfoController,
  autoJoinChannelByInviteController,
} from "../controllers/channel.controller";

const channelRoutes = Router();

// Public routes
channelRoutes.get("/public", getPublicChannelsController);
channelRoutes.get("/:channelId/info", getChannelInfoController);
channelRoutes.get("/:channelId/invite-info", getChannelInviteInfoController);

// Protected routes
channelRoutes.use(passportAuthenticateJwt);

channelRoutes.post("/create", createChannelController);
channelRoutes.put("/:channelId", updateChannelController);
channelRoutes.get("/user/my-channels", getUserChannelsController);
channelRoutes.post("/:channelId/subscribe", subscribeToChannelController);
channelRoutes.post("/:channelId/unsubscribe", unsubscribeFromChannelController);
channelRoutes.post("/:channelId/add-subscriber", subscribeToChannelController);
channelRoutes.post("/:channelId/remove-subscriber", unsubscribeFromChannelController);
channelRoutes.post("/:channelId/mark-as-read", markChannelAsReadController);
channelRoutes.post(
  "/:channelId/admin/:userId/add",
  promoteToAdminController
);
channelRoutes.post(
  "/:channelId/admin/:userId/remove",
  demoteAdminController
);
channelRoutes.post("/:channelId/join-by-invite", autoJoinChannelByInviteController);
// Allow deletion of a channel by its creator or admins
channelRoutes.delete("/:channelId", deleteChannelController);

export default channelRoutes;
