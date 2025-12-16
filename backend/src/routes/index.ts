import { Router } from "express";
import authRoutes from "./auth.route";
import chatRoutes from "./chat.route";
import userRoutes from "./user.route";
import channelRoutes from "./channel.route";
import communityRoutes from "./community.route";
import adminRoutes from "./admin.route";

const router = Router();
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/user", userRoutes);
router.use("/users", userRoutes);
router.use("/channel", channelRoutes);
router.use("/community", communityRoutes);
router.use("/admin", adminRoutes);

export default router;
