import { Router } from "express";
import authRoutes from "./auth.route";
import chatRoutes from "./chat.route";
import userRoutes from "./user.route";
import channelRoutes from "./channel.route";
import communityRoutes from "./community.route";
import adminRoutes from "./admin.route";
import inviteRoutes from "./invite.route";
import { HTTPSTATUS } from "../config/http.config";

const router = Router();
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/user", userRoutes);
router.use("/users", userRoutes);
router.use("/channel", channelRoutes);
router.use("/community", communityRoutes);
router.use("/admin", adminRoutes);
router.use("/invite", inviteRoutes);

router.get("/version", (req, res) => {
  res.status(HTTPSTATUS.OK).json({
    latestVersion: "1.0.0",
    minimumVersion: "1.0.0",
    downloadUrl: "https://your-domain.com/downloads/app-release.apk",
    releaseNotes: "Initial release"
  });
});

export default router;
