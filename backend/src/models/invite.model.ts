import mongoose, { Document, Schema } from "mongoose";

export enum InviteType {
  GROUP = "GROUP",
  CHANNEL = "CHANNEL",
  COMMUNITY = "COMMUNITY"
}

export enum InviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED"
}

export interface InviteDocument extends Document {
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId; // If registered
  recipientEmail?: string; // If not registered or invite by email
  targetId: mongoose.Types.ObjectId;
  targetType: InviteType;
  token?: string; // For link-based invites
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<InviteDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recipientEmail: { type: String, trim: true, lowercase: true, default: null },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: Object.values(InviteType), required: true },
    token: { type: String, unique: true, sparse: true },
    status: { type: String, enum: Object.values(InviteStatus), default: InviteStatus.PENDING },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

inviteSchema.index({ recipient: 1, status: 1 });
inviteSchema.index({ recipientEmail: 1, status: 1 });
inviteSchema.index({ token: 1 });

const InviteModel = mongoose.model<InviteDocument>("Invite", inviteSchema);
export default InviteModel;
