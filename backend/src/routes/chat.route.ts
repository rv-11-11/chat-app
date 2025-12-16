import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  createChatController,
  getSingleChatController,
  getUserChatsController,
  markChatAsReadController,
  addMemberToChatController,
  removeMemberFromChatController,
  promoteToGroupAdminController,
  deleteChatController,
  updateChatController,
  inviteUserToChatController,
  autoJoinChatByInviteController,
  getChatInviteInfoController,
} from "../controllers/chat.controller";
import { sendMessageController } from "../controllers/message.controller";

const chatRoutes = Router();

// Public invite info endpoint (no auth required)
chatRoutes.get("/:id/invite-info", getChatInviteInfoController);

// All other chat routes require authentication
chatRoutes
  .use(passportAuthenticateJwt)
  .post("/create", createChatController)
  .get("/all", getUserChatsController)
  .post("/message/send", sendMessageController)
  .post("/:id/mark-as-read", markChatAsReadController)
  .post("/:id/add-member", addMemberToChatController)
  .post("/:id/remove-member", removeMemberFromChatController)
  .post("/:id/promote-member", promoteToGroupAdminController)
  .post("/:id/invite-user", inviteUserToChatController)
  .post("/:id/join-by-invite", autoJoinChatByInviteController)
  .delete("/:id", deleteChatController)
  .put("/:id", updateChatController)
  .get("/:id", getSingleChatController);

export default chatRoutes;
