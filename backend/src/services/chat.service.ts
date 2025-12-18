import mongoose from "mongoose";
import { emitNewChatToParticpants, emitNewMessageToChatRoom } from "../lib/socket";
import cloudinary from "../config/cloudinary.config";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "../services/utils/app-error";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
    groupDescription?: string;
    groupUsername?: string;
    groupRules?: string;
    groupTopic?: string;
    groupCategory?: string;
    isPublic?: boolean;
    allowInviteLinkJoin?: boolean;
    icon?: string;
  }
) => {
  const { 
    participantId, isGroup, participants, groupName, 
    groupDescription, groupUsername, groupRules, groupTopic, groupCategory,
    isPublic, icon, allowInviteLinkJoin 
  } = body;

  let chat;
  let allParticipantIds: string[] = [];
  let iconUrl = icon || null;

  if (isGroup && participants?.length && groupName) {
    if (icon) {
      try {
        const uploadRes = await cloudinary.uploader.upload(icon, {
          resource_type: "auto",
          folder: "chat-app/groups",
        });
        iconUrl = uploadRes.secure_url;
      } catch (error) {
        console.error("Failed to upload icon to Cloudinary:", error);
      }
    }

    allParticipantIds = [userId, ...participants];
    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      groupDescription,
      groupUsername: groupUsername?.toLowerCase(),
      groupRules,
      groupTopic,
      groupCategory: groupCategory || "other",
      isPublic: isPublic ?? false,
      icon: iconUrl,
      allowInviteLinkJoin: allowInviteLinkJoin ?? true,
      admins: [userId],
      createdBy: userId,
    });
  } else if (participantId) {
    const otherUser = await UserModel.findById(participantId);
    if (!otherUser) throw new NotFoundException("User not found");

    allParticipantIds = [userId, participantId];
    const existingChat = await ChatModel.findOne({
      participants: {
        $all: allParticipantIds,
        $size: 2,
      },
    }).populate("participants", "name avatar");

    if (existingChat) return existingChat;

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId,
    });
  }

  // Implement websocket
  const populatedChat = await chat?.populate(
    "participants",
    "name avatar isAI"
  );
  const particpantIdStrings = populatedChat?.participants?.map((p) => {
    return p._id?.toString();
  });

  emitNewChatToParticpants(particpantIdStrings, populatedChat);

  return chat;
};

export const getUserChatsService = async (userId: string) => {
  const chats = await ChatModel.find({
    participants: {
      $in: [userId],
    },
    type: { $ne: "CHANNEL" }, // Exclude channels from regular chats
  })
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });

  // Add unreadCount for each chat
  const chatsWithUnread = chats.map((chat) => {
    const unreadCount = chat.unreadBy?.filter(
      (id) => id.toString() === userId
    ).length || 0;
    return {
      ...chat.toObject(),
      unreadCount,
    };
  });

  return chatsWithUnread;
};

export const getSingleChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  }).populate("participants", "name avatar");

  if (!chat)
    throw new BadRequestException(
      "Chat not found or you are not authorized to view this chat"
    );

  const messages = await MessageModel.find({ chatId })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ createdAt: 1 });

  return {
    chat,
    messages,
  };
};

export const getChatInviteInfoService = async (chatId: string) => {
  const chat = await ChatModel.findById(chatId).select("groupName participants isPublic admins isGroup icon allowInviteLinkJoin");
  if (!chat) throw new NotFoundException("Chat not found");

  return {
    _id: chat._id,
    groupName: chat.groupName,
    participantsCount: (chat.participants || []).length,
    isPublic: chat.isPublic,
    isGroup: chat.isGroup,
    icon: chat.icon || null,
    allowInviteLinkJoin: chat.allowInviteLinkJoin,
  };
};

export const validateChatParticipant = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("User not a participant in chat");
  return chat;
};

export const markChatAsReadService = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });

  if (!chat) throw new BadRequestException("Chat not found or unauthorized");

  // Remove user from unreadBy array
  chat.unreadBy = chat.unreadBy.filter((id) => id.toString() !== userId);
  await chat.save();

  return chat;
};

export const addMemberToChatService = async (
  chatId: string,
  memberId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // Verify it's a group chat
  if (!chat.isGroup) throw new BadRequestException("This is not a group chat");

  // Verify the requester is allowed:
  // - group creator or admin can add anyone
  // - for public groups, a user may join themselves (used by invite/join flows)
  const isCreator = chat.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());
  const isSelfJoinPublicGroup = chat.isPublic && userId.toString() === memberId.toString();

  if (!isCreator && !isAdmin && !isSelfJoinPublicGroup) {
    throw new ForbiddenException(
      "Only group creator or admins can add members, unless it is a public group and you are joining yourself"
    );
  }

  // Check if member already exists
  if (chat.participants.some((id) => id.toString() === memberId)) {
    throw new BadRequestException("Member already in group");
  }

  // Add member
  chat.participants.push(new mongoose.Types.ObjectId(memberId));
  
  // Get user info for system message
  const newMember = await UserModel.findById(memberId);
  const adder = await UserModel.findById(userId);
  
  await chat.save();

  // Create system message
  const systemMessage = await MessageModel.create({
    chatId,
    content: `${adder?.name || "Admin"} added ${newMember?.name || "User"} to the group`,
    messageType: "SYSTEM",
  });

  // Update last message
  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Emit system message to all participants
  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

export const removeMemberFromChatService = async (
  chatId: string,
  memberId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // Verify it's a group chat
  if (!chat.isGroup) throw new BadRequestException("This is not a group chat");

  // Verify the requester is the creator OR the member leaving
  if (chat.createdBy.toString() !== userId.toString() && userId.toString() !== memberId.toString()) {
    throw new ForbiddenException("You cannot remove this member");
  }

  // Remove member
  const memberIndex = chat.participants.findIndex(
    (id) => id.toString() === memberId
  );

  if (memberIndex === -1) {
    throw new BadRequestException("Member not found in group");
  }

  // Get user info for system message
  const user = await UserModel.findById(memberId);
  
  chat.participants.splice(memberIndex, 1);
  await chat.save();

  // Create system message
  const isLeavingVoluntarily = userId === memberId;
  const systemMessage = await MessageModel.create({
    chatId,
    content: isLeavingVoluntarily 
      ? `${user?.name || "User"} left the group`
      : `${user?.name || "User"} was removed from the group`,
    messageType: "SYSTEM",
  });

  // Update last message
  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Emit system message to all participants (including the one who left for real-time update)
  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

export const promoteToGroupAdminService = async (
  chatId: string,
  memberId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // Verify it's a group chat
  if (!chat.isGroup) throw new BadRequestException("This is not a group chat");

  // Verify the requester is the creator or an admin
  const isCreator = chat.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());
  
  if (!isCreator && !isAdmin) {
    throw new ForbiddenException("Only group creator or admins can promote members");
  }

  // Prevent self-promotion
  if (userId.toString() === memberId.toString()) {
    throw new ForbiddenException("You cannot promote yourself");
  }

  // Check if member exists
  if (!chat.participants.some((id) => id.toString() === memberId)) {
    throw new BadRequestException("Member not found in group");
  }

  // Check if already admin
  if (chat.admins.some((id) => id.toString() === memberId)) {
    throw new BadRequestException("Member is already an admin");
  }

  // Add to admins
  chat.admins.push(new mongoose.Types.ObjectId(memberId));
  
  // Get user info for system message
  const promotedUser = await UserModel.findById(memberId);
  const promoter = await UserModel.findById(userId);
  
  await chat.save();

  // Create system message
  const systemMessage = await MessageModel.create({
    chatId,
    content: `${promoter?.name || "Admin"} promoted ${promotedUser?.name || "User"} to admin`,
    messageType: "SYSTEM",
  });

  // Update last message
  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Emit system message to all participants
  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

export const demoteFromAdminService = async (
  chatId: string,
  memberId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  if (!chat.isGroup) throw new BadRequestException("This is not a group chat");

  const isCreator = chat.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());
  
  if (!isCreator && !isAdmin) {
    throw new ForbiddenException("Only group creator or admins can demote members");
  }

  // Prevent self-demotion
  if (userId.toString() === memberId.toString()) {
    throw new ForbiddenException("You cannot demote yourself");
  }

  if (!chat.participants.some((id) => id.toString() === memberId)) {
    throw new BadRequestException("Member not found in group");
  }

  if (!chat.admins.some((id) => id.toString() === memberId)) {
    throw new BadRequestException("Member is not an admin");
  }

  const adminIndex = chat.admins.findIndex((id) => id.toString() === memberId);
  chat.admins.splice(adminIndex, 1);
  
  const demotedUser = await UserModel.findById(memberId);
  const demoter = await UserModel.findById(userId);
  
  await chat.save();

  const systemMessage = await MessageModel.create({
    chatId,
    content: `${demoter?.name || "Admin"} removed ${demotedUser?.name || "User"} from admin role`,
    messageType: "SYSTEM",
  });

  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

export const deleteChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // If it's a group chat, verify the requester is the creator or an admin
  if (chat.isGroup) {
    const isCreator = chat.createdBy.toString() === userId.toString();
    const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());
    
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException("Only group creator or admins can delete the group");
    }
  }

  // Delete the chat and all associated messages
  await ChatModel.findByIdAndDelete(chatId);
  await MessageModel.deleteMany({ chatId });

  return { message: "Chat deleted successfully" };
};

export const updateChatService = async (
  chatId: string,
  userId: string,
  data: {
    groupName?: string;
    groupDescription?: string;
    groupUsername?: string;
    groupRules?: string;
    groupTopic?: string;
    groupCategory?: string;
    icon?: string;
    channelDescription?: string;
    isPublic?: boolean;
    allowInviteLinkJoin?: boolean;
  }
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  const isCreator = chat.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());

  if (!isCreator && !isAdmin) {
    throw new ForbiddenException("Only admins can update chat settings");
  }

  if (data.icon && data.icon !== chat.icon) {
    try {
      const uploadRes = await cloudinary.uploader.upload(data.icon, {
        resource_type: "auto",
        folder: "chat-app/groups",
      });
      data.icon = uploadRes.secure_url;
    } catch (error) {
      console.error("Failed to upload icon update to Cloudinary:", error);
    }
  }

  if (data.groupName !== undefined) chat.groupName = data.groupName;
  if (data.groupDescription !== undefined) chat.groupDescription = data.groupDescription;
  if (data.groupUsername !== undefined) chat.groupUsername = data.groupUsername?.toLowerCase();
  if (data.groupRules !== undefined) chat.groupRules = data.groupRules;
  if (data.groupTopic !== undefined) chat.groupTopic = data.groupTopic;
  if (data.groupCategory !== undefined) chat.groupCategory = data.groupCategory;
  if (data.icon !== undefined) chat.icon = data.icon;
  if (data.channelDescription !== undefined)
    chat.channelDescription = data.channelDescription;
  if (data.isPublic !== undefined) chat.isPublic = data.isPublic;
  if (data.allowInviteLinkJoin !== undefined)
    chat.allowInviteLinkJoin = data.allowInviteLinkJoin;

  await chat.save();

  return chat;
};

export const inviteUserToChatService = async (
  chatId: string,
  userId: string,
  invitedUserId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // Verify it's a group or channel
  if (chat.type !== "GROUP" && chat.type !== "CHANNEL") {
    throw new BadRequestException("Can only invite users to groups or channels");
  }

  // Verify the requester is allowed (creator, admin, or public groups)
  const isCreator = chat.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins.some((id) => id.toString() === userId.toString());
  const isPublic = chat.isPublic;

  if (!isCreator && !isAdmin && !isPublic) {
    throw new ForbiddenException(
      "Only group creator or admins can invite members"
    );
  }

  // Check if invited user is already a member
  if (chat.participants.some((id) => id.toString() === invitedUserId)) {
    throw new BadRequestException("User is already a member of this group");
  }

  // Add invited user to participants
  chat.participants.push(new mongoose.Types.ObjectId(invitedUserId));

  // Get user info for system message
  const invitedUser = await UserModel.findById(invitedUserId);
  const inviter = await UserModel.findById(userId);

  await chat.save();

  // Create system message
  const systemMessage = await MessageModel.create({
    chatId,
    content: `${inviter?.name || "Admin"} invited ${invitedUser?.name || "User"} to the group`,
    messageType: "SYSTEM",
  });

  // Update last message
  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Emit system message to all participants
  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

export const autoJoinChatByInviteService = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);

  if (!chat) throw new BadRequestException("Chat not found");

  // Respect admin toggle for invite links
  if (chat.allowInviteLinkJoin === false) {
    throw new ForbiddenException(
      "Invite link joining is disabled for this group"
    );
  }

  // Check if user is already a member
  if (chat.participants.some((id) => id.toString() === userId)) {
    throw new BadRequestException("You are already a member of this group");
  }

  // Add user to participants
  chat.participants.push(new mongoose.Types.ObjectId(userId));

  // Get user info for system message
  const user = await UserModel.findById(userId);

  await chat.save();

  // Create system message
  const systemMessage = await MessageModel.create({
    chatId,
    content: `${user?.name || "User"} joined the group`,
    messageType: "SYSTEM",
  });

  // Update last message
  chat.lastMessage = systemMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Emit system message to all participants
  emitNewMessageToChatRoom(userId, chatId, systemMessage, {
    includeSender: true,
  });

  return await chat.populate("participants", "name avatar");
};

