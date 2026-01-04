import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Env } from "../config/env.config";
import NotificationModel, { NotificationType } from "../models/notification.model";
import UserModel from "../models/user.model";
import connectDatabase from "../config/database.config";
import * as NotificationService from "../services/notification.service";

const runTest = async () => {
  // Mock Env variables if needed, or ensure .env is loaded
  // Assuming connectDatabase loads env config or it's already loaded
  
  await connectDatabase();

  console.log("Starting Notification System Test...");

  try {
    // 1. Create a test user
    const testUser = await UserModel.create({
      name: "Test User",
      email: `testuser_${Date.now()}@example.com`,
      password: "password123",
      username: `testuser_${Date.now()}`
    });
    console.log("1. Test user created:", testUser._id);

    // 2. Create a notification via Service (tests service logic and safe socket call)
    const notification = await NotificationService.createNotification(
      testUser._id as string,
      NotificationType.SYSTEM,
      "Test Notification",
      "This is a test notification",
      { testId: "123" }
    );
    console.log("2. Notification created via Service:", notification._id);

    // 3. Fetch notifications
    const notifications = await NotificationModel.find({ recipient: testUser._id });
    console.log("3. Notifications fetched:", notifications.length);
    if (notifications.length !== 1) throw new Error("Expected 1 notification");
    if (notifications[0].title !== "Test Notification") throw new Error("Title mismatch");

    // 4. Mark as read
    await NotificationModel.updateOne({ _id: notification._id }, { $set: { isRead: true } });
    const updatedNotification = await NotificationModel.findById(notification._id);
    console.log("4. Notification marked as read:", updatedNotification?.isRead);
    if (!updatedNotification?.isRead) throw new Error("Notification should be read");

    // 5. Delete notification
    await NotificationModel.findByIdAndDelete(notification._id);
    const deletedNotification = await NotificationModel.findById(notification._id);
    console.log("5. Notification deleted:", deletedNotification === null);
    if (deletedNotification) throw new Error("Notification should be deleted");

    // 6. Clean up
    await UserModel.findByIdAndDelete(testUser._id);
    console.log("6. Test user cleaned up");

    console.log("✅ All tests passed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runTest();
