import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  createChannelService,
  subscribeToChannelService,
  unsubscribeFromChannelService,
  promoteToAdminService,
  demoteAdminService,
  getChannelInfoService,
  getPublicChannelsService,
  getUserChannelsService,
  markChannelAsReadService,
  updateChannelService,
  deleteChannelService,
  getChannelInviteInfoService,
  autoJoinChannelByInviteService,
} from "../services/channel.service";
import { ForbiddenException } from "../services/utils/app-error";

export const createChannelController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { name, description, isPublic, icon, username } = req.body;

    const channel = await createChannelService(userId, {
      name,
      description,
      isPublic,
      icon,
      username,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Channel created successfully",
      channel,
    });
  }
);

export const getPublicChannelsController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await getPublicChannelsService(page, limit, search);

    return res.status(HTTPSTATUS.OK).json({
      message: "Public channels retrieved successfully",
      ...result,
    });
  }
);

export const getUserChannelsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const channels = await getUserChannelsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User channels retrieved successfully",
      channels,
    });
  }
);

export const subscribeToChannelController = asyncHandler(
  async (req: Request, res: Response) => {
    // If userId is in body, use it (admin adding subscriber), otherwise use logged-in user.
    // Guard against undefined req.body to avoid runtime TypeError.
    const body = (req.body || {}) as { userId?: string };
    const userId = body.userId || req.user?._id;

    if (!userId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Unable to determine target user for subscription",
      });
    }
    const { channelId } = req.params;

    const channel = await subscribeToChannelService(channelId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Subscribed to channel successfully",
      channel,
    });
  }
);

export const unsubscribeFromChannelController = asyncHandler(
  async (req: Request, res: Response) => {
    // If userId is in body, use it (admin removing subscriber), otherwise use logged-in user
    const body = (req.body || {}) as { userId?: string };
    const userId = body.userId || req.user?._id;
    const { channelId } = req.params;

    const channel = await unsubscribeFromChannelService(channelId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Unsubscribed from channel successfully",
      channel,
    });
  }
);

export const promoteToAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const promoterId = req.user?._id;
    const { channelId, userId } = req.params;

    const channel = await promoteToAdminService(channelId, userId, promoterId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User promoted to admin successfully",
      channel,
    });
  }
);

export const demoteAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const demoterId = req.user?._id;
    const { channelId, userId } = req.params;

    const channel = await demoteAdminService(channelId, userId, demoterId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User demoted from admin successfully",
      channel,
    });
  }
);

export const getChannelInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;

    const channel = await getChannelInfoService(channelId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Channel info retrieved successfully",
      channel,
    });
  }
);

export const markChannelAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { channelId } = req.params;

    const channel = await markChannelAsReadService(channelId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Channel marked as read",
      channel,
    });
  }
);

export const updateChannelController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { channelId } = req.params;
    const { name, description, icon, allowInviteLinkJoin } = req.body;

    const channel = await updateChannelService(channelId, userId, {
      name,
      description,
      icon,
      allowInviteLinkJoin,
    });
    return res.status(HTTPSTATUS.OK).json({
      message: "Channel updated successfully",
      channel,
    });
  }
);

export const getChannelInviteInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const info = await getChannelInviteInfoService(channelId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Channel invite info",
      info,
    });
  }
);

export const autoJoinChannelByInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ForbiddenException("Authentication required");
    }
    const { channelId } = req.params;

    const channel = await autoJoinChannelByInviteService(channelId, userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Joined channel successfully",
      channel,
    });
  }
);

export const deleteChannelController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { channelId } = req.params;

    const result = await deleteChannelService(channelId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);
