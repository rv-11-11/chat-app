import mongoose from "mongoose";
import ChatModel, { ChatType } from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../services/utils/app-error";
import {
  emitNewChatToParticpants,
  emitNewMessageToChatRoom,
} from "../lib/socket";
import cloudinary from "../config/cloudinary.config";

export const createChannelService = async (
  userId: string,
  body: {
    name: string;
    description?: string;
    isPublic?: boolean;
    icon?: string;
    username?: string;
  }
) => {
  const { name, description, isPublic = true, icon, username } = body;

  if (!name || name.trim().length === 0) {
    throw new BadRequestException("Channel name is required");
  }

  // Generate or validate username
  let channelUsername = username;
  if (channelUsername) {
    // Validate format
    if (!/^[a-z0-9_]+$/.test(channelUsername)) {
      throw new BadRequestException(
        "Username can only contain lowercase letters, numbers, and underscores"
      );
    }
    // Check if username already exists
    const existingChannel = await ChatModel.findOne({ channelUsername });
    if (existingChannel) {
      throw new BadRequestException("Username is already taken");
    }
  } else {
    // Auto-generate username from channel name
    channelUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 30);

    // Ensure uniqueness by adding number suffix if needed
    let counter = 1;
    let uniqueUsername = channelUsername;
    while (await ChatModel.findOne({ channelUsername: uniqueUsername })) {
      uniqueUsername = `${channelUsername}_${counter}`;
      counter++;
    }
    channelUsername = uniqueUsername;
  }

  let iconUrl = icon || null;
  if (icon) {
    try {
      const uploadRes = await cloudinary.uploader.upload(icon, {
        resource_type: "auto",
        folder: "chat-app/channels",
      });
      iconUrl = uploadRes.secure_url;
    } catch (error) {
      console.error("Failed to upload channel icon:", error);
    }
  }

  const channel = await ChatModel.create({
    groupName: name,
    channelDescription: description,
    channelUsername,
    type: ChatType.CHANNEL,
    isPublic,
    isGroup: true,
    icon: iconUrl,
    participants: [userId],
    admins: [userId],
    createdBy: userId,
    subscriberCount: 1,
    allowInviteLinkJoin: true,
  });

  const populatedChannel = await channel.populate("participants", "name avatar");

  return populatedChannel;
};

export const subscribeToChannelService = async (
  channelId: string,
  userId: string
) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  if (!channel.isPublic) {
    throw new ForbiddenException(
      "This is a private channel. You cannot join without an invitation"
    );
  }

  const isAlreadySubscribed = channel.participants.some(
    (id) => id.toString() === userId
  );

  if (isAlreadySubscribed) {
    throw new BadRequestException("Already subscribed to this channel");
  }

  // Add the new subscriber
  channel.participants.push(new mongoose.Types.ObjectId(userId));

  // Remove any duplicates that might exist
  channel.participants = [...new Set(channel.participants.map(id => id.toString()))].map(
    id => new mongoose.Types.ObjectId(id)
  );

  channel.subscriberCount = channel.participants.length;
  await channel.save();

  const user = await UserModel.findById(userId);
  const systemMessage = await MessageModel.create({
    chatId: channel._id,
    content: `${user?.name || "User"} subscribed to the channel`,
    messageType: "SYSTEM",
  });

  channel.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await channel.save();

  emitNewMessageToChatRoom(userId, channelId, systemMessage, {
    includeSender: true,
  });

  const populatedChannel = await channel.populate(
    "participants",
    "name avatar"
  );

  return populatedChannel;
};

export const unsubscribeFromChannelService = async (
  channelId: string,
  userId: string
) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  const participantIndex = channel.participants.findIndex(
    (id) => id.toString() === userId
  );

  if (participantIndex === -1) {
    throw new BadRequestException("You are not subscribed to this channel");
  }

  // Prevent channel creator from leaving if they're the only admin
  const isCreator = channel.createdBy.toString() === userId;
  const isAdmin = channel.admins.some((id) => id.toString() === userId);

  if (isAdmin && channel.admins.length === 1) {
    throw new ForbiddenException(
      "Cannot leave channel as the last admin. Transfer admin rights first"
    );
  }

  channel.participants.splice(participantIndex, 1);

  // Remove from admins if applicable
  const adminIndex = channel.admins.findIndex(
    (id) => id.toString() === userId
  );
  if (adminIndex !== -1) {
    channel.admins.splice(adminIndex, 1);
  }

  channel.subscriberCount = channel.participants.length;
  await channel.save();

  const user = await UserModel.findById(userId);
  const systemMessage = await MessageModel.create({
    chatId: channel._id,
    content: `${user?.name || "User"} left the channel`,
    messageType: "SYSTEM",
  });

  channel.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await channel.save();

  emitNewMessageToChatRoom(userId, channelId, systemMessage, {
    includeSender: true,
  });

  const populatedChannel = await channel.populate(
    "participants",
    "name avatar"
  );

  return populatedChannel;
};

export const promoteToAdminService = async (
  channelId: string,
  userId: string,
  promoterId: string
) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  // Clean up duplicate admins if any
  const uniqueAdminIds = [...new Set(channel.admins.map(id => id.toString()))];
  if (uniqueAdminIds.length !== channel.admins.length) {
    channel.admins = uniqueAdminIds.map(id => new mongoose.Types.ObjectId(id));
  }

  // Verify promoter is admin
  const isPromoterAdmin = channel.admins.some(
    (id) => id.toString() === promoterId.toString()
  );

  if (!isPromoterAdmin) {
    console.log("Promoter check failed:");
    console.log("Promoter ID:", promoterId);
    console.log("Channel admins:", channel.admins.map(id => id.toString()));
    throw new ForbiddenException("Only admins can promote users");
  }

  // Check if user is participant
  const isParticipant = channel.participants.some(
    (id) => id.toString() === userId
  );

  if (!isParticipant) {
    throw new BadRequestException("User is not a member of this channel");
  }

  // Check if already admin
  const isAlreadyAdmin = channel.admins.some(
    (id) => id.toString() === userId
  );

  if (isAlreadyAdmin) {
    throw new BadRequestException("User is already an admin");
  }

  channel.admins.push(new mongoose.Types.ObjectId(userId));
  await channel.save();

  const populatedChannel = await channel.populate([
    { path: "participants", select: "name avatar" },
    { path: "admins", select: "name avatar" },
  ]);

  return populatedChannel;
};

export const demoteAdminService = async (
  channelId: string,
  userId: string,
  demoterId: string
) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  // Verify demoter is admin
  const isDemoterAdmin = channel.admins.some(
    (id) => id.toString() === demoterId
  );

  if (!isDemoterAdmin) {
    throw new ForbiddenException("Only admins can demote users");
  }

  // Prevent removing last admin
  if (channel.admins.length === 1) {
    throw new ForbiddenException("Cannot remove the last admin from channel");
  }

  const adminIndex = channel.admins.findIndex(
    (id) => id.toString() === userId
  );

  if (adminIndex === -1) {
    throw new BadRequestException("User is not an admin");
  }

  channel.admins.splice(adminIndex, 1);
  await channel.save();

  const populatedChannel = await channel.populate([
    { path: "participants", select: "name avatar" },
    { path: "admins", select: "name avatar" },
  ]);

  return populatedChannel;
};

export const getChannelInfoService = async (channelId: string) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  // Clean up any duplicate participants before returning
  const uniqueParticipantIds = [...new Set(channel.participants.map(id => id.toString()))];
  const uniqueAdminIds = [...new Set(channel.admins.map(id => id.toString()))];

  let needsSave = false;

  if (uniqueParticipantIds.length !== channel.participants.length) {
    // Update if duplicates found
    channel.participants = uniqueParticipantIds.map(id => new mongoose.Types.ObjectId(id));
    channel.subscriberCount = channel.participants.length;
    needsSave = true;
  }

  if (uniqueAdminIds.length !== channel.admins.length) {
    // Update if duplicates found in admins
    channel.admins = uniqueAdminIds.map(id => new mongoose.Types.ObjectId(id));
    needsSave = true;
  }

  if (needsSave) {
    await channel.save();
  }

  // Populate after cleaning
  await channel.populate([
    { path: "participants", select: "name avatar _id" },
    { path: "admins", select: "name avatar _id" },
    { path: "createdBy", select: "name avatar _id" },
  ]);

  return {
    ...channel.toObject(),
    subscriberCount: channel.participants.length,
  };
};

export const getChannelInviteInfoService = async (channelId: string) => {
  const channel = await ChatModel.findById(channelId).select(
    "groupName participants isPublic icon allowInviteLinkJoin type"
  );

  if (!channel || channel.type !== ChatType.CHANNEL) {
    throw new NotFoundException("Channel not found");
  }

  return {
    _id: channel._id,
    groupName: channel.groupName,
    participantsCount: (channel.participants || []).length,
    isPublic: channel.isPublic,
    icon: channel.icon || null,
    allowInviteLinkJoin: channel.allowInviteLinkJoin,
  };
};

export const autoJoinChannelByInviteService = async (
  channelId: string,
  userId: string
) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  if (!channel.isPublic) {
    throw new ForbiddenException(
      "Only public channels can be auto-joined"
    );
  }

  if (channel.allowInviteLinkJoin === false) {
    throw new ForbiddenException(
      "Invite link joining is disabled for this channel"
    );
  }

  if (channel.participants.some((id) => id.toString() === userId)) {
    throw new BadRequestException("You are already subscribed to this channel");
  }

  channel.participants.push(new mongoose.Types.ObjectId(userId));
  channel.participants = [...new Set(channel.participants.map((id) => id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  channel.subscriberCount = channel.participants.length;
  await channel.save();

  const user = await UserModel.findById(userId);
  const systemMessage = await MessageModel.create({
    chatId: channel._id,
    content: `${user?.name || "User"} joined the channel`,
    messageType: "SYSTEM",
  });

  channel.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await channel.save();

  emitNewMessageToChatRoom(userId, channelId, systemMessage, {
    includeSender: true,
  });

  await channel.populate("participants", "name avatar");

  return channel;
};

export const getPublicChannelsService = async (
  page: number = 1,
  limit: number = 20,
  search?: string
) => {
  const skip = (page - 1) * limit;

  // Build search query
  const searchQuery: any = {
    type: ChatType.CHANNEL,
    isPublic: true,
  };

  // If search provided, search by channel name or username
  if (search && search.trim()) {
    const searchTerm = search.trim();
    // Remove @ if user includes it in search
    const rawSearch = searchTerm.startsWith('@') ? searchTerm.slice(1) : searchTerm;
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cleanSearch = escapeRegex(rawSearch);

    searchQuery.$or = [
      { groupName: { $regex: cleanSearch, $options: 'i' } },
      { channelUsername: { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  const channels = await ChatModel.find(searchQuery)
    .select("groupName channelDescription channelUsername subscriberCount createdAt icon")
    .populate("createdBy", "name avatar")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ChatModel.countDocuments(searchQuery);

  // Public channels don't show unreadCount, but add 0 for consistency
  const channelsWithUnread = channels.map((channel) => ({
    ...channel.toObject(),
    unreadCount: 0,
  }));

  return {
    channels: channelsWithUnread,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserChannelsService = async (userId: string) => {
  const channels = await ChatModel.find({
    type: ChatType.CHANNEL,
    participants: {
      $in: [userId],
    },
  })
    .populate("participants", "name avatar")
    .populate("admins", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });

  // Add unreadCount for each channel
  const channelsWithUnread = channels.map((channel) => {
    const unreadCount = channel.unreadBy?.filter(
      (id) => id.toString() === userId
    ).length || 0;
    return {
      ...channel.toObject(),
      unreadCount,
    };
  });

  return channelsWithUnread;
};

export const markChannelAsReadService = async (
  channelId: string,
  userId: string
) => {
  const channel = await ChatModel.findOne({
    _id: channelId,
    type: ChatType.CHANNEL,
    participants: {
      $in: [userId],
    },
  });

  if (!channel) {
    throw new BadRequestException("Channel not found or unauthorized");
  }

  // Remove user from unreadBy array
  channel.unreadBy = channel.unreadBy.filter((id) => id.toString() !== userId);
  await channel.save();

  return channel;
};

export const updateChannelService = async (
  channelId: string,
  userId: string,
  body: {
    name?: string;
    description?: string;
    icon?: string;
    allowInviteLinkJoin?: boolean;
  }
) => {
  const { name, description, icon } = body;

  const channel = await ChatModel.findById(channelId);

  if (!channel) {
    throw new NotFoundException("Channel not found");
  }

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  // Normalize admin ids to string values. Admins may be stored as ObjectIds,
  // plain strings, or populated user documents ({ _id }). Convert all to id strings
  // before comparison to avoid mismatches.
  const userIdStr = userId ? userId.toString() : "";
  const adminIdStrings: string[] = (channel.admins || []).map((a: any) => {
    if (!a) return "";
    if (typeof a === "string") return a.toString();
    if (a._id) return a._id.toString();
    try {
      return a.toString();
    } catch {
      return "";
    }
  });

  const isAdmin = adminIdStrings.includes(userIdStr);

  if (!isAdmin) {
    throw new ForbiddenException("Only admins can update channel information");
  }

  // Update name if provided
  if (name && name.trim().length > 0) {
    channel.groupName = name.trim();
  }

  // Update description if provided
  if (description !== undefined) {
    channel.channelDescription = description;
  }

  // Update icon if provided
  if (icon !== undefined) {
    if (icon) {
      try {
        const uploadRes = await cloudinary.uploader.upload(icon, {
          resource_type: "auto",
          folder: "chat-app/channels",
        });
        channel.icon = uploadRes.secure_url;
      } catch (error) {
        console.error("Failed to upload channel icon:", error);
        throw new BadRequestException("Failed to upload channel icon");
      }
    } else {
      // If icon is empty string, remove it
      channel.icon = undefined;
    }
  }

  if (body.allowInviteLinkJoin !== undefined) {
    channel.allowInviteLinkJoin = body.allowInviteLinkJoin;
  }

  await channel.save();

  const populatedChannel = await channel.populate([
    { path: "participants", select: "name avatar" },
    { path: "admins", select: "name avatar" },
  ]);

  return populatedChannel;
};

export const deleteChannelService = async (channelId: string, userId: string) => {
  const channel = await ChatModel.findById(channelId);

  if (!channel) throw new NotFoundException("Channel not found");

  if (channel.type !== ChatType.CHANNEL) {
    throw new BadRequestException("This chat is not a channel");
  }

  const isCreator = channel.createdBy?.toString() === userId?.toString();
  const adminIdStrings: string[] = (channel.admins || []).map((a: any) => {
    if (!a) return "";
    if (typeof a === "string") return a.toString();
    if (a._id) return a._id.toString();
    try {
      return a.toString();
    } catch {
      return "";
    }
  });

  const isAdmin = adminIdStrings.includes(userId?.toString() || "");

  if (!isCreator && !isAdmin) {
    throw new ForbiddenException("Only channel creator or admins can delete this channel");
  }

  // Delete the channel chat and its messages
  await ChatModel.findByIdAndDelete(channelId);
  await MessageModel.deleteMany({ chatId: channelId });

  return { message: "Channel deleted successfully" };
};
