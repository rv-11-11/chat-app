import mongoose, { Document, Schema } from "mongoose";

export enum ChatType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
  CHANNEL = "CHANNEL",
}

export interface ChatDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: mongoose.Types.ObjectId;
  type: ChatType;
  isGroup?: boolean; // Deprecated, use type instead
  groupName?: string;
  channelDescription?: string;
  channelUsername?: string; // Unique username for channels (e.g., @channelname)
  icon?: string;
  admins: mongoose.Types.ObjectId[];
  isPublic: boolean;
  subscriberCount: number;
  createdBy: mongoose.Types.ObjectId;
  unreadBy: mongoose.Types.ObjectId[]; // Users who have unread messages
  createdAt: Date;
  updatedAt: Date;
  allowInviteLinkJoin: boolean;
}

const chatSchema = new Schema<ChatDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(ChatType),
      default: ChatType.DIRECT,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
    },
    channelDescription: {
      type: String,
    },
    channelUsername: {
      type: String,
      unique: true,
      sparse: true, // Only enforce uniqueness for non-null values
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/, // Only lowercase alphanumeric and underscores
    },
    icon: {
      type: String,
      default: null,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowInviteLinkJoin: {
      type: Boolean,
      default: true,
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    unreadBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatModel = mongoose.model<ChatDocument>("Chat", chatSchema);
export default ChatModel;
