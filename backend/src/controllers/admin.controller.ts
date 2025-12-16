import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getDashboardStatsService,
  getAllUsersService,
  suspendUserService,
  unsuspendUserService,
  deleteUserService,
  getReportsService,
  resolveReportService,
  dismissReportService,
  getChatAnalyticsService,
  createReportService,
} from "../services/admin.service";
import ReportModel from "../models/report.model";

export const getDashboardStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getDashboardStatsService();

    return res.status(HTTPSTATUS.OK).json({
      message: "Dashboard stats retrieved successfully",
      stats,
    });
  }
);

export const getAllUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";

    const result = await getAllUsersService(page, limit, search);

    return res.status(HTTPSTATUS.OK).json({
      message: "Users retrieved successfully",
      ...result,
    });
  }
);

export const suspendUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { durationInDays, reason } = req.body;

    const user = await suspendUserService(userId, durationInDays, reason);

    return res.status(HTTPSTATUS.OK).json({
      message: "User suspended successfully",
      user,
    });
  }
);

export const unsuspendUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await unsuspendUserService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User unsuspended successfully",
      user,
    });
  }
);

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await deleteUserService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User deleted successfully",
      user,
    });
  }
);

export const getReportsController = asyncHandler(
  async (req: Request, res: Response) => {
    const status = (req.query.status as string) || undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getReportsService(status, page, limit);

    return res.status(HTTPSTATUS.OK).json({
      message: "Reports retrieved successfully",
      ...result,
    });
  }
);

export const resolveReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?._id;
    const { reportId } = req.params;
    const { resolution, action } = req.body;

    const report = await resolveReportService(
      reportId,
      adminId,
      resolution,
      action
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Report resolved successfully",
      report,
    });
  }
);

export const dismissReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const report = await dismissReportService(reportId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Report dismissed successfully",
      report,
    });
  }
);

export const getChatAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;

    const analytics = await getChatAnalyticsService(days);

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat analytics retrieved successfully",
      analytics,
    });
  }
);

// Report endpoints (public)
export const createReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const reportedById = req.user?._id;
    const { targetType, targetId, reason, description } = req.body;

    const report = await createReportService(
      reportedById,
      targetType,
      targetId,
      reason,
      description
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Report submitted successfully",
      report,
    });
  }
);

export const getUserReportsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;

    const reports = await ReportModel.find({
      reportedBy: userId,
    })
      .populate("reportedBy", "name email avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ReportModel.countDocuments({
      reportedBy: userId,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "User reports retrieved successfully",
      reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  }
);
