import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import NotificationModel, { NotificationType } from "../models/notification.model";
import { HTTPSTATUS } from "../config/http.config";
import * as NotificationService from "../services/notification.service";

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, type = NotificationType.SYSTEM, title, message, data } = req.body;
  const senderId = req.user?._id;

  // If no recipientId provided, send to self (for testing)
  const targetId = recipientId || senderId;

  if (!targetId || !title || !message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required fields" });
  }

  const notification = await NotificationService.createNotification(
    targetId,
    type,
    title,
    message,
    data,
    senderId
  );

  res.status(HTTPSTATUS.CREATED).json(notification);
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  
  const notifications = await NotificationModel.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "name avatar");

  const unreadCount = await NotificationModel.countDocuments({ recipient: userId, isRead: false });

  res.status(HTTPSTATUS.OK).json({
    notifications,
    unreadCount
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { notificationIds } = req.body; // Array of IDs or 'all'

  if (notificationIds === 'all') {
    await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
  } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    await NotificationModel.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { $set: { isRead: true } }
    );
  }

  res.status(HTTPSTATUS.OK).json({ message: "Notifications marked as read" });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;

    await NotificationModel.findOneAndDelete({ _id: id, recipient: userId });
    
    res.status(HTTPSTATUS.OK).json({ message: "Notification deleted" });
});
