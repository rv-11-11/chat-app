import { Request, Response, NextFunction } from "express";
import { ForbiddenException, UnauthorizedException } from "../services/utils/app-error";
import { UserRole } from "../models/user.model";

interface RequestWithUser extends Request {
  user?: any;
}

export const isAdmin = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedException("User not authenticated");
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenException("Admin access required");
  }

  next();
};

export const isModerator = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedException("User not authenticated");
  }

  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.MODERATOR
  ) {
    throw new ForbiddenException("Moderator access required");
  }

  next();
};

export const checkNotSuspended = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedException("User not authenticated");
  }

  if (req.user.isSuspended) {
    throw new ForbiddenException("Your account has been suspended");
  }

  next();
};
