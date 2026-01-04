import mongoose, { Document, Schema } from "mongoose";

export enum NotificationType {
  MESSAGE = "MESSAGE",
  CHANNEL_POST = "CHANNEL_POST",
  MENTION = "MENTION",
  SYSTEM = "SYSTEM",
  INVITE = "INVITE"
}

export interface NotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // Related ID (chatId, channelId, etc.)
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
export default NotificationModel;
