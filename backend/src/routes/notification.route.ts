import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { getNotifications, markAsRead, deleteNotification, createNotification } from "../controllers/notification.controller";

const notificationRoutes = Router();

notificationRoutes.use(passportAuthenticateJwt);

notificationRoutes.post("/", createNotification);
notificationRoutes.get("/", getNotifications);
notificationRoutes.put("/read", markAsRead);
notificationRoutes.delete("/:id", deleteNotification);

export default notificationRoutes;
