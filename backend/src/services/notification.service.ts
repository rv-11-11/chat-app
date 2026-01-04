import NotificationModel, { NotificationType } from "../models/notification.model";
import { sendNotification } from "../lib/socket";

export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  senderId?: string
) => {
  const notification = await NotificationModel.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    data,
  });

  // Populate sender details if needed for the UI
  await notification.populate("sender", "name avatar");

  // Send real-time update
  sendNotification(recipientId, notification);

  return notification;
};
