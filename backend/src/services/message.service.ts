import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import ChatModel, { ChatType } from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, ForbiddenException, NotFoundException } from "../services/utils/app-error";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from "../lib/socket";
import UserModel from "../models/user.model";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const sendMessageService = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    file?: {
      data: string; // base64
      name: string;
      type: string;
      size: number;
    };
    replyToId?: string;
  }
) => {
  const { chatId, content, image, file, replyToId } = body;
  // Accept video payload if present
  const video = (body as any).video as
    | {
        data: string;
        name: string;
        type: string;
        size: number;
      }
    | undefined;

  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("Chat not found or unauthorized");

  // Check if user is admin for CHANNEL type chats
  if (chat.type === ChatType.CHANNEL) {
    const isAdmin = chat.admins.some((admin) => 
      admin.toString() === userId.toString()
    );
    if (!isAdmin) {
      throw new ForbiddenException(
        "Only channel admins can post messages in this channel"
      );
    }
  }

  if (replyToId) {
    const replyMessage = await MessageModel.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw new NotFoundException("Reply message not found");
  }

  let imageUrl;
  let fileMetadata;
  let videoMetadata;

  if (image) {
    // Validate image size
    const imageSizeInBytes = Buffer.byteLength(image, "base64");
    if (imageSizeInBytes > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        "Image size exceeds 10MB limit"
      );
    }

    // Upload image to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      resource_type: "auto",
      folder: "chat-app/images",
    });
    imageUrl = uploadRes.secure_url;
  }

  if (file) {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new BadRequestException(
        `File type '${file.type}' is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR, PPT`
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        "File size exceeds 50MB limit"
      );
    }

    // Upload file to cloudinary
    const uploadRes = await cloudinary.uploader.upload(file.data, {
      resource_type: "raw",
      folder: "chat-app/files",
      public_id: file.name.split(".")[0],
    });

    fileMetadata = {
      url: uploadRes.secure_url,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  }

  if (video) {
  console.debug(`[message.service] Received video payload for user=${userId} chat=${chatId} name=${video.name} size=${video.size}`);
    // Very permissive type check — allow common video mimetypes
    if (!video.type.startsWith("video/")) {
      throw new BadRequestException(`File type '${video.type}' is not a supported video type`);
    }

    // Max video size 100MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
    if (video.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException("Video size exceeds 100MB limit");
    }

    // Upload video to cloudinary
  const uploadRes = await cloudinary.uploader.upload(video.data, {
      resource_type: "video",
      folder: "chat-app/videos",
      public_id: video.name.split(".")[0],
    });

  console.debug(`[message.service] Cloudinary upload result for ${video.name}: ${uploadRes?.secure_url ? 'OK' : 'NO_URL'} duration=${uploadRes?.duration}`);

    // Cloudinary returns duration in seconds sometimes in `duration` field.
    videoMetadata = {
      url: uploadRes.secure_url,
      name: video.name,
      duration: uploadRes.duration || 0,
      thumbnail: uploadRes?.thumbnail_url || null,
      size: video.size,
    };
  }

  const newMessage = await MessageModel.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
  file: fileMetadata || null,
  video: videoMetadata || null,
    replyTo: replyToId || null,
  });

  await newMessage.populate([
    { path: "sender", select: "name avatar" },
    {
      path: "replyTo",
      select: "content image file sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;

  // Mark all non-sender participants as unread
  chat.unreadBy = chat.participants.filter(
    (id) => id.toString() !== userId
  ) as mongoose.Types.ObjectId[];

  await chat.save();

  console.debug(`[message.service] Created message ${newMessage._id} chat=${chatId} video=${!!newMessage.video}`);
  //websocket emit the new Message to the chat room
  emitNewMessageToChatRoom(userId, chatId, newMessage);

  //websocket emit the lastmessage to members (personnal room user) - exclude sender
  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage, userId);

  return {
    userMessage: newMessage,
    chat,
  };
};
