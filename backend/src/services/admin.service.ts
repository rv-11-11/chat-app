import UserModel, { UserRole } from "../models/user.model";
import ReportModel, { ReportStatus } from "../models/report.model";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import {
  BadRequestException,
  NotFoundException,
} from "../services/utils/app-error";

export const getDashboardStatsService = async () => {
  const userCount = await UserModel.countDocuments();
  const messageCount = await MessageModel.countDocuments();
  const chatCount = await ChatModel.countDocuments();
  const pendingReports = await ReportModel.countDocuments({
    status: "PENDING",
  });

  return {
    userCount,
    messageCount,
    chatCount,
    pendingReports,
    timestamp: new Date(),
  };
};

export const getAllUsersService = async (
  page: number = 1,
  limit: number = 20,
  search: string = ""
) => {
  const skip = (page - 1) * limit;
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const users = await UserModel.find(query)
    .select("-password")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await UserModel.countDocuments(query);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const suspendUserService = async (
  userId: string,
  durationInDays: number,
  reason: string
) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (user.role === UserRole.ADMIN) {
    throw new BadRequestException("Cannot suspend admin users");
  }

  const suspendedUntil = new Date();
  suspendedUntil.setDate(suspendedUntil.getDate() + durationInDays);

  user.isSuspended = true;
  user.suspendedUntil = suspendedUntil;
  user.suspensionReason = reason;
  await user.save();

  return user;
};

export const unsuspendUserService = async (userId: string) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  user.isSuspended = false;
  user.suspendedUntil = undefined;
  user.suspensionReason = undefined;
  await user.save();

  return user;
};

export const deleteUserService = async (userId: string) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Soft delete - keep data but mark as inactive
  user.isSuspended = true;
  user.suspensionReason = "Account deleted";
  user.email = `deleted-${Date.now()}-${user.email}`;
  user.password = "";
  user.name = "Deleted User";
  await user.save();

  return user;
};

export const getReportsService = async (
  status?: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
  const query = status ? { status } : {};

  const reports = await ReportModel.find(query)
    .populate("reportedBy", "name email avatar")
    .populate("resolvedBy", "name email avatar")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ReportModel.countDocuments(query);

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const resolveReportService = async (
  reportId: string,
  adminId: string,
  resolution: string,
  action?: "suspend" | "delete" | "dismiss"
) => {
  const report = await ReportModel.findById(reportId);

  if (!report) {
    throw new NotFoundException("Report not found");
  }

  report.status = ReportStatus.RESOLVED as any;
  report.resolvedBy = adminId as any;
  report.resolution = resolution;
  await report.save();

  // Take action if specified
  if (action === "suspend" && report.targetType === "USER") {
    await suspendUserService(report.targetId.toString(), 30, resolution);
  } else if (action === "delete" && report.targetType === "USER") {
    await deleteUserService(report.targetId.toString());
  }

  return report;
};

export const dismissReportService = async (reportId: string) => {
  const report = await ReportModel.findById(reportId);

  if (!report) {
    throw new NotFoundException("Report not found");
  }

  report.status = ReportStatus.DISMISSED as any;
  await report.save();

  return report;
};

export const getChatAnalyticsService = async (days: number = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyStats = await MessageModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        messageCount: { $sum: 1 },
        uniqueUsers: { $addToSet: "$sender" },
      },
    },
    {
      $project: {
        _id: 1,
        messageCount: 1,
        activeUsers: { $size: "$uniqueUsers" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const totalMessages = await MessageModel.countDocuments({
    createdAt: { $gte: startDate },
  });

  const activeChats = await ChatModel.countDocuments({
    updatedAt: { $gte: startDate },
  });

  const activeUsers = await MessageModel.distinct("sender", {
    createdAt: { $gte: startDate },
  });

  return {
    period: {
      startDate,
      endDate: new Date(),
      days,
    },
    dailyStats,
    summary: {
      totalMessages,
      activeChats,
      activeUsersCount: activeUsers.length,
    },
  };
};

export const createReportService = async (
  reportedById: string,
  targetType: string,
  targetId: string,
  reason: string,
  description: string
) => {
  const report = await ReportModel.create({
    reportedBy: reportedById,
    targetType,
    targetId,
    reason,
    description,
    status: "PENDING",
  });

  const populatedReport = await report.populate(
    "reportedBy",
    "name email avatar"
  );

  return populatedReport;
};
