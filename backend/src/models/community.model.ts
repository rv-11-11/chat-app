import mongoose, { Document, Schema } from "mongoose";

export interface CommunityDocument extends Document {
  name: string;
  description: string;
  icon?: string; // Cloudinary URL
  creator: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  groups: mongoose.Types.ObjectId[]; // References to Chat documents with type GROUP
  channels: mongoose.Types.ObjectId[]; // References to Chat documents with type CHANNEL
  members: mongoose.Types.ObjectId[];
  isPublic: boolean;
  allowInviteLinkJoin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communitySchema = new Schema<CommunityDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: null,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    channels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    members: [
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
  },
  {
    timestamps: true,
  }
);

const CommunityModel = mongoose.model<CommunityDocument>(
  "Community",
  communitySchema
);
export default CommunityModel;
