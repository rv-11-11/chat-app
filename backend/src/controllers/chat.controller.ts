import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { chatIdSchema, createChatSchema } from "../validators/chat.validator";
import {
  createChatService,
  getSingleChatService,
  getUserChatsService,
  markChatAsReadService,
  addMemberToChatService,
  removeMemberFromChatService,
  promoteToGroupAdminService,
  demoteFromAdminService,
  deleteChatService,
  updateChatService,
  inviteUserToChatService,
  autoJoinChatByInviteService,
  getChatInviteInfoService,
} from "../services/chat.service";

export const getChatInviteInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = chatIdSchema.parse(req.params);
    const info = await getChatInviteInfoService(id);
    return res.status(HTTPSTATUS.OK).json({ message: "Invite info", info });
  }
);

export const createChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = createChatSchema.parse(req.body);

    const chat = await createChatService(userId, body);

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat created or retrieved successfully",
      chat,
    });
  }
);

export const getUserChatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const chats = await getUserChatsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User chats retrieved successfully",
      chats,
    });
  }
);

export const getSingleChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);

    const { chat, messages } = await getSingleChatService(id, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User chats retrieved successfully",
      chat,
      messages,
    });
  }
);

export const markChatAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);

    const chat = await markChatAsReadService(id, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat marked as read",
      chat,
    });
  }
);

export const addMemberToChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { userId: memberId } = req.body;

    const chat = await addMemberToChatService(id, memberId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Member added to chat",
      chat,
    });
  }
);

export const removeMemberFromChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { userId: memberId } = req.body;

    const chat = await removeMemberFromChatService(id, memberId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Member removed from chat",
      chat,
    });
  }
);

export const promoteToGroupAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { userId: memberId } = req.body;

    const chat = await promoteToGroupAdminService(id, memberId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Member promoted to admin",
      chat,
    });
  }
);

export const demoteFromAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { userId: memberId } = req.body;

    const chat = await demoteFromAdminService(id, memberId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Member removed from admin role",
      chat,
    });
  }
);

export const deleteChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);

    const result = await deleteChatService(id, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const updateChatController = asyncHandler(
  async (req: Request, res: Response) => {
    // Update chat settings
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { 
      groupName, icon, channelDescription, isPublic, allowInviteLinkJoin, strictMode,
      groupDescription, groupUsername, groupRules, groupTopic, groupCategory 
    } = req.body;

    const chat = await updateChatService(id, userId, {
      groupName,
      groupDescription,
      groupUsername,
      groupRules,
      groupTopic,
      groupCategory,
      icon,
      channelDescription,
      isPublic,
      allowInviteLinkJoin,
      strictMode,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat updated successfully",
      chat,
    });
  }
);

export const inviteUserToChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);
    const { userId: invitedUserId } = req.body;

    const chat = await inviteUserToChatService(id, userId, invitedUserId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User invited to chat successfully",
      chat,
    });
  }
);

export const autoJoinChatByInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = chatIdSchema.parse(req.params);

    const chat = await autoJoinChatByInviteService(id, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Joined chat successfully",
      chat,
    });
  }
);
