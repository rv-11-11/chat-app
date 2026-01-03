import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../services/utils/app-error";
import type { UpdateProfileSchemaType } from "../validators/auth.validator";

export const findByIdUserService = async (userId: string) => {
  return await UserModel.findById(userId);
};

export const getUsersService = async (userId: string, search?: string) => {
  const query: any = { _id: { $ne: userId } };

  // Only return users if search query is provided (minimum 2 characters)
  if (!search || search.trim().length < 2) {
    return [];
  }

  // Add search filter for name
  query.name = { $regex: search.trim(), $options: 'i' };

  const users = await UserModel.find(query)
    .select("-password")
    .limit(20); // Limit results to prevent excessive data

  return users;
};

export const updateUserProfileService = async (
  userId: string,
  body: UpdateProfileSchemaType
) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (body.email && body.email !== user.email) {
    const existing = await UserModel.findOne({ email: body.email });
    if (existing && String(existing._id) !== userId) {
      throw new UnauthorizedException("Email is already in use");
    }
  }

  if (body.username && body.username !== user.username) {
    const existing = await UserModel.findOne({ username: body.username });
    if (existing && String(existing._id) !== userId) {
      throw new UnauthorizedException("Username is already in use");
    }
    user.username = body.username;
  }

  user.name = body.name;
  user.email = body.email;

  if (typeof body.phone !== "undefined") {
    user.phone = body.phone;
  }

  if (typeof body.avatar !== "undefined") {
    user.avatar = body.avatar;
  }

  if (typeof body.isOnlineVisible !== "undefined") {
    user.isOnlineVisible = body.isOnlineVisible;
  }

  if (typeof body.readReceipts !== "undefined") {
    user.readReceipts = body.readReceipts;
  }

  await user.save();
  return user;
};
