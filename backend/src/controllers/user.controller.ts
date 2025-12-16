import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getUsersService, updateUserProfileService } from "../services/user.service";
import { updateProfileSchema } from "../validators/auth.validator";

export const getUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const search = req.query.search as string | undefined;

    const users = await getUsersService(userId, search);

    return res.status(HTTPSTATUS.OK).json({
      message: "Users retrieved successfully",
      users,
    });
  }
);

export const updateProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const body = updateProfileSchema.parse(req.body);
    const user = await updateUserProfileService(userId, body);

    return res.status(HTTPSTATUS.OK).json({
      message: "Profile updated successfully",
      user,
    });
  }
);
