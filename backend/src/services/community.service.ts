import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import CommunityModel from "../models/community.model";
import ChatModel, { ChatType } from "../models/chat.model";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../services/utils/app-error";

export const createCommunityService = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    icon?: string;
    isPublic?: boolean;
  }
) => {
  const { name, description, icon, isPublic = false } = data;

  if (!name || name.trim().length === 0) {
    throw new BadRequestException("Community name is required");
  }

  let iconUrl = icon || null;
  if (icon) {
    try {
      const uploadRes = await cloudinary.uploader.upload(icon, {
        resource_type: "auto",
        folder: "chat-app/communities",
      });
      iconUrl = uploadRes.secure_url;
    } catch (error) {
      console.error("Failed to upload community icon:", error);
    }
  }

  const community = await CommunityModel.create({
    name,
    description: description || "",
    icon: iconUrl,
    creator: userId,
    admins: [userId],
    members: [userId],
    isPublic,
    allowInviteLinkJoin: true,
    groups: [],
    channels: [],
  });

  const populatedCommunity = await community.populate([
    { path: "creator", select: "name avatar _id" },
    { path: "admins", select: "name avatar _id" },
    { path: "members", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const addChatToCommunityService = async (
  communityId: string,
  chatId: string,
  chatType: ChatType,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throw new ForbiddenException("Only community admins can add chats");
  }

  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    throw new NotFoundException("Chat not found");
  }

  if (chatType === ChatType.GROUP) {
    if (community.groups.some((id) => id.toString() === chatId)) {
      throw new BadRequestException("This group is already in the community");
    }
    community.groups.push(new mongoose.Types.ObjectId(chatId));
  } else if (chatType === ChatType.CHANNEL) {
    if (community.channels.some((id) => id.toString() === chatId)) {
      throw new BadRequestException("This channel is already in the community");
    }
    community.channels.push(new mongoose.Types.ObjectId(chatId));
  } else {
    throw new BadRequestException("Cannot add direct chats to communities");
  }

  await community.save();

  const populatedCommunity = await community.populate([
    { path: "groups", select: "groupName participants _id" },
    { path: "channels", select: "groupName participants _id" },
  ]);

  return populatedCommunity;
};

export const removeChatFromCommunityService = async (
  communityId: string,
  chatId: string,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throw new ForbiddenException("Only community admins can remove chats");
  }

  community.groups = community.groups.filter((id) => id.toString() !== chatId);
  community.channels = community.channels.filter(
    (id) => id.toString() !== chatId
  );

  await community.save();

  const populatedCommunity = await community.populate([
    { path: "groups", select: "groupName participants _id" },
    { path: "channels", select: "groupName participants _id" },
  ]);

  return populatedCommunity;
};

export const addMemberToCommunityService = async (
  communityId: string,
  memberId: string,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throw new ForbiddenException("Only community admins can add members");
  }

  const isAlreadyMember = community.members.some(
    (id) => id.toString() === memberId
  );

  if (isAlreadyMember) {
    throw new BadRequestException("User is already a member of this community");
  }

  community.members.push(new mongoose.Types.ObjectId(memberId));
  await community.save();

  const memberObjId = new mongoose.Types.ObjectId(memberId);

  if (community.groups && community.groups.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.groups } },
      { $addToSet: { participants: memberObjId } }
    );
  }

  if (community.channels && community.channels.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.channels } },
      { $addToSet: { participants: memberObjId } }
    );
  }

  const populatedCommunity = await community.populate([
    { path: "members", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const removeMemberFromCommunityService = async (
  communityId: string,
  memberId: string,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community or removing themselves
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  const isRemovingOwnself = userId.toString() === memberId.toString();

  if (!isAdmin && !isRemovingOwnself) {
    throw new ForbiddenException("You cannot remove this member");
  }

  const memberIndex = community.members.findIndex(
    (id) => id.toString() === memberId
  );

  if (memberIndex === -1) {
    throw new BadRequestException("User is not a member of this community");
  }

  community.members.splice(memberIndex, 1);

  // Remove from admins if applicable
  const adminIndex = community.admins.findIndex(
    (id) => id.toString() === memberId
  );
  if (adminIndex !== -1) {
    community.admins.splice(adminIndex, 1);
  }

  await community.save();

  const populatedCommunity = await community.populate([
    { path: "members", select: "name avatar _id" },
    { path: "admins", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const getCommunityInviteInfoService = async (communityId: string) => {
  const community = await CommunityModel.findById(communityId).select(
    "name description icon members isPublic allowInviteLinkJoin"
  );

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  return {
    _id: community._id,
    name: community.name,
    description: community.description,
    icon: community.icon,
    isPublic: community.isPublic,
    allowInviteLinkJoin: community.allowInviteLinkJoin,
    membersCount: community.members?.length || 0,
  };
};

export const getCommunityService = async (communityId: string) => {
  const community = await CommunityModel.findById(communityId).populate([
    { path: "creator", select: "name avatar _id" },
    { path: "admins", select: "name avatar _id" },
    { path: "members", select: "name avatar _id" },
    {
      path: "groups",
      select: "groupName participants _id type icon",
      populate: { path: "participants", select: "name avatar _id" },
    },
    {
      path: "channels",
      select: "groupName channelDescription participants admins _id type icon",
      populate: [
        { path: "participants", select: "name avatar _id" },
        { path: "admins", select: "name avatar _id" },
      ],
    },
  ]);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  return community;
};

export const getUserCommunitiesService = async (userId: string) => {
  const communities = await CommunityModel.find({
    members: { $in: [userId] },
  })
    .populate({ path: "creator", select: "name avatar _id" })
    .populate({ path: "admins", select: "name avatar _id" })
    .populate({ path: "members", select: "name avatar _id" })
    .sort({ createdAt: -1 });

  return communities;
};

export const joinCommunityService = async (
  communityId: string,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  if (!community.isPublic) {
    throw new ForbiddenException(
      "Only public communities can be joined directly"
    );
  }

  const isAlreadyMember = community.members.some(
    (id) => id.toString() === userId
  );

  if (isAlreadyMember) {
    throw new BadRequestException("You are already a member of this community");
  }

  community.members.push(new mongoose.Types.ObjectId(userId));
  await community.save();

  const userObjId = new mongoose.Types.ObjectId(userId);

  if (community.groups && community.groups.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.groups } },
      { $addToSet: { participants: userObjId } }
    );
  }

  if (community.channels && community.channels.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.channels } },
      { $addToSet: { participants: userObjId } }
    );
  }

  const populatedCommunity = await community.populate([
    { path: "members", select: "name avatar _id" },
    { path: "admins", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const updateCommunityService = async (
  communityId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    isPublic?: boolean;
    allowInviteLinkJoin?: boolean;
  }
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throw new ForbiddenException("Only community admins can update details");
  }

  if (data.icon && data.icon !== community.icon) {
    try {
      const uploadRes = await cloudinary.uploader.upload(data.icon, {
        resource_type: "auto",
        folder: "chat-app/communities",
      });
      data.icon = uploadRes.secure_url;
    } catch (error) {
      console.error("Failed to upload community icon update:", error);
    }
  }

  if (data.name !== undefined) community.name = data.name;
  if (data.description !== undefined) community.description = data.description;
  if (data.icon !== undefined) community.icon = data.icon;
  if (data.isPublic !== undefined) community.isPublic = data.isPublic;
  if (data.allowInviteLinkJoin !== undefined)
    community.allowInviteLinkJoin = data.allowInviteLinkJoin;

  await community.save();

  return community;
};

export const getPublicCommunitiesService = async (
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const communities = await CommunityModel.find({
    isPublic: true,
  })
    .select("name description icon creator members isPublic createdAt")
    .populate({ path: "creator", select: "name avatar _id" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await CommunityModel.countDocuments({
    isPublic: true,
  });

  return {
    communities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const inviteUserToCommunityService = async (
  communityId: string,
  userId: string,
  invitedUserId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  // Verify user is admin of community
  const isAdmin = community.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throw new ForbiddenException("Only community admins can invite members");
  }

  const isAlreadyMember = community.members.some(
    (id) => id.toString() === invitedUserId
  );

  if (isAlreadyMember) {
    throw new BadRequestException("User is already a member of this community");
  }

  community.members.push(new mongoose.Types.ObjectId(invitedUserId));
  await community.save();

  const memberObjId = new mongoose.Types.ObjectId(invitedUserId);

  if (community.groups && community.groups.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.groups } },
      { $addToSet: { participants: memberObjId } }
    );
  }

  if (community.channels && community.channels.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.channels } },
      { $addToSet: { participants: memberObjId } }
    );
  }

  const populatedCommunity = await community.populate([
    { path: "members", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const autoJoinCommunityByInviteService = async (
  communityId: string,
  userId: string
) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) {
    throw new NotFoundException("Community not found");
  }

  const isAlreadyMember = community.members.some(
    (id) => id.toString() === userId
  );

  if (isAlreadyMember) {
    throw new BadRequestException("You are already a member of this community");
  }

  if (!community.isPublic) {
    throw new ForbiddenException(
      "Only public communities can be auto-joined"
    );
  }

  if (community.allowInviteLinkJoin === false) {
    throw new ForbiddenException(
      "Invite link joining is disabled for this community"
    );
  }

  community.members.push(new mongoose.Types.ObjectId(userId));
  await community.save();

  const userObjId = new mongoose.Types.ObjectId(userId);

  if (community.groups && community.groups.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.groups } },
      { $addToSet: { participants: userObjId } }
    );
  }

  if (community.channels && community.channels.length > 0) {
    await ChatModel.updateMany(
      { _id: { $in: community.channels } },
      { $addToSet: { participants: userObjId } }
    );
  }

  const populatedCommunity = await community.populate([
    { path: "members", select: "name avatar _id" },
  ]);

  return populatedCommunity;
};

export const deleteCommunityService = async (communityId: string, userId: string) => {
  const community = await CommunityModel.findById(communityId);

  if (!community) throw new NotFoundException("Community not found");

  const isCreator = community.creator?.toString() === userId?.toString();
  const isAdmin = community.admins.some((id) => id.toString() === userId?.toString());

  if (!isCreator && !isAdmin) {
    throw new ForbiddenException("Only community creator or admins can delete this community");
  }

  // Optionally, you may want to remove community association from chats; we'll leave chats intact,
  // but delete the community document and its references.
  await CommunityModel.findByIdAndDelete(communityId);

  return { message: "Community deleted successfully" };
};
