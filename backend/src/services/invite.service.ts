import mongoose from "mongoose";
import InviteModel, { InviteStatus, InviteType } from "../models/invite.model";
import ChatModel from "../models/chat.model";
import CommunityModel from "../models/community.model";
import UserModel from "../models/user.model";
import { BadRequestException, NotFoundException, ForbiddenException } from "./utils/app-error";
import crypto from "crypto";

export const createInviteService = async (
  senderId: string,
  targetId: string,
  targetType: InviteType,
  recipientId?: string,
  recipientEmail?: string
) => {
  if (!recipientId && !recipientEmail) {
    throw new BadRequestException("Must provide recipientId or recipientEmail");
  }

  // 1. Validate Target
  if (targetType === InviteType.GROUP || targetType === InviteType.CHANNEL) {
    const chat = await ChatModel.findById(targetId);
    if (!chat) throw new NotFoundException("Chat/Channel not found");
    
    const isAdmin = chat.admins.some(id => id.toString() === senderId.toString()) || chat.createdBy.toString() === senderId.toString();
    if (!isAdmin && !chat.isPublic) throw new ForbiddenException("Not authorized to invite");
    
    if (recipientId && chat.participants.some(id => id.toString() === recipientId)) {
        throw new BadRequestException("User already in chat");
    }
  } else if (targetType === InviteType.COMMUNITY) {
    const comm = await CommunityModel.findById(targetId);
    if (!comm) throw new NotFoundException("Community not found");
    
    const isAdmin = comm.admins.some(id => id.toString() === senderId.toString()) || comm.creator.toString() === senderId.toString();
    if (!isAdmin) throw new ForbiddenException("Not authorized to invite");

    if (recipientId && comm.members.some(id => id.toString() === recipientId)) {
        throw new BadRequestException("User already in community");
    }
  }

  // 2. Check existing pending invite
  const query: any = {
    targetId,
    targetType,
    status: InviteStatus.PENDING,
    expiresAt: { $gt: new Date() }
  };
  
  if (recipientId) query.recipient = recipientId;
  else if (recipientEmail) query.recipientEmail = recipientEmail;

  const existing = await InviteModel.findOne(query);
  if (existing) return existing;

  // 3. Create Invite
  const invite = await InviteModel.create({
    sender: senderId,
    recipient: recipientId || null,
    recipientEmail: recipientEmail || null,
    targetId,
    targetType,
    status: InviteStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    token: crypto.randomBytes(16).toString("hex")
  });

  return invite;
};

export const getMyInvitesService = async (userId: string) => {
    // Fetch invites
    const invites = await InviteModel.find({
        recipient: userId,
        status: InviteStatus.PENDING,
        expiresAt: { $gt: new Date() }
    }).populate("sender", "name avatar").sort({ createdAt: -1 });

    // Manually populate target details since it's polymorphic
    const populatedInvites = await Promise.all(invites.map(async (invite) => {
        let targetName = "Unknown";
        let targetIcon = null;
        
        if (invite.targetType === InviteType.GROUP || invite.targetType === InviteType.CHANNEL) {
            const chat = await ChatModel.findById(invite.targetId).select("groupName icon");
            if (chat) {
                targetName = chat.groupName || "Chat";
                targetIcon = chat.icon;
            }
        } else if (invite.targetType === InviteType.COMMUNITY) {
            const comm = await CommunityModel.findById(invite.targetId).select("name icon");
            if (comm) {
                targetName = comm.name;
                targetIcon = comm.icon;
            }
        }

        return {
            ...invite.toObject(),
            targetName,
            targetIcon
        };
    }));

    return populatedInvites;
};

export const respondToInviteService = async (inviteId: string, userId: string, action: "accept" | "decline") => {
    const invite = await InviteModel.findById(inviteId);
    if (!invite) throw new NotFoundException("Invite not found");
    
    if (invite.recipient?.toString() !== userId.toString()) {
        throw new ForbiddenException("Not your invite");
    }

    if (invite.status !== InviteStatus.PENDING) {
        throw new BadRequestException("Invite not pending");
    }

    if (invite.expiresAt < new Date()) {
        invite.status = InviteStatus.EXPIRED;
        await invite.save();
        throw new BadRequestException("Invite expired");
    }

    if (action === "decline") {
        invite.status = InviteStatus.DECLINED;
        await invite.save();
        return { message: "Invite declined" };
    }

    // Accept
    if (invite.targetType === InviteType.GROUP || invite.targetType === InviteType.CHANNEL) {
        await ChatModel.findByIdAndUpdate(invite.targetId, {
            $addToSet: { participants: userId }
        });
    } else if (invite.targetType === InviteType.COMMUNITY) {
        const comm = await CommunityModel.findById(invite.targetId);
        if (comm) {
            comm.members.push(new mongoose.Types.ObjectId(userId));
            await comm.save();
            // Add to groups/channels
            if (comm.groups?.length) await ChatModel.updateMany({ _id: { $in: comm.groups } }, { $addToSet: { participants: userId } });
            if (comm.channels?.length) await ChatModel.updateMany({ _id: { $in: comm.channels } }, { $addToSet: { participants: userId } });
        }
    }

    invite.status = InviteStatus.ACCEPTED;
    await invite.save();
    return { message: "Invite accepted" };
};

// Called after signup
export const claimInvitesByEmailService = async (email: string, userId: string) => {
    await InviteModel.updateMany(
        { recipientEmail: email, recipient: null },
        { recipient: userId }
    );
};
