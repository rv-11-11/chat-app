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
  groupDescription?: string; // Description for groups
  groupUsername?: string; // Unique username for groups (e.g., @groupname)
  groupRules?: string; // Group rules/guidelines
  groupTopic?: string; // Main topic of the group
  groupCategory?: string; // Category/type of group (e.g., "study", "gaming", "work", "hobbies")
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
  strictMode?: boolean;
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
    groupDescription: {
      type: String,
      default: null,
    },
    groupUsername: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
    },
    groupRules: {
      type: String,
      default: null,
    },
    groupTopic: {
      type: String,
      default: null,
    },
    groupCategory: {
      type: String,
      enum: ["study", "gaming", "work", "hobbies", "sports", "entertainment", "other"],
      default: "other",
    },
    channelDescription: {
      type: String,
    },
    channelUsername: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
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
    strictMode: {
      type: Boolean,
      default: false,
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
