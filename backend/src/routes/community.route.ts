import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  createCommunityController,
  getUserCommunitiesController,
  getPublicCommunitiesController,
  getCommunityController,
  addChatToCommunityController,
  removeChatFromCommunityController,
  addMemberToCommunityController,
  removeMemberFromCommunityController,
  joinCommunityController,
  updateCommunityController,
  inviteUserToCommunityController,
  autoJoinCommunityByInviteController,
  deleteCommunityController,
  getCommunityInviteInfoController,
  promoteToCommunityAdminController,
  demoteFromCommunityAdminController,
} from "../controllers/community.controller";

const communityRoutes = Router();

// Public routes
communityRoutes.get("/public", getPublicCommunitiesController);
communityRoutes.get("/:communityId/invite-info", getCommunityInviteInfoController);

// Protected routes
communityRoutes.use(passportAuthenticateJwt);

communityRoutes.post("/create", createCommunityController);
communityRoutes.get("/my", getUserCommunitiesController);
communityRoutes.get("/user/my-communities", getUserCommunitiesController);

communityRoutes.post("/:communityId/join", joinCommunityController);
communityRoutes.post("/:communityId/join-by-invite", autoJoinCommunityByInviteController);

// This must come after specific routes to avoid conflicts
communityRoutes.get("/:communityId", getCommunityController);
communityRoutes.put("/:communityId", updateCommunityController);

communityRoutes.post("/:communityId/chat/add", addChatToCommunityController);
communityRoutes.delete(
  "/:communityId/chat/:chatId",
  removeChatFromCommunityController
);

communityRoutes.post(
  "/:communityId/member/:memberId/add",
  addMemberToCommunityController
);
communityRoutes.post(
  "/:communityId/member/:memberId/invite",
  inviteUserToCommunityController
);
communityRoutes.delete(
  "/:communityId/member/:memberId",
  removeMemberFromCommunityController
);

communityRoutes.post(
  "/:communityId/admin/:memberId/promote",
  promoteToCommunityAdminController
);

communityRoutes.post(
  "/:communityId/admin/:memberId/demote",
  demoteFromCommunityAdminController
);

// Allow deletion of a community by its creator or admins
communityRoutes.delete("/:communityId", deleteCommunityController);

export default communityRoutes;
