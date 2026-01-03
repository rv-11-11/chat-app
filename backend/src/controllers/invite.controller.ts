import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { createInviteService, getMyInvitesService, respondToInviteService } from "../services/invite.service";
import { InviteType } from "../models/invite.model";

export const createInviteController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const schema = z.object({
        targetId: z.string(),
        targetType: z.nativeEnum(InviteType),
        recipientId: z.string().optional(),
        recipientEmail: z.string().email().optional()
    });
    
    const { targetId, targetType, recipientId, recipientEmail } = schema.parse(req.body);
    
    const invite = await createInviteService(userId, targetId, targetType, recipientId, recipientEmail);
    
    return res.status(HTTPSTATUS.CREATED).json({
        message: "Invite created successfully",
        invite
    });
});

export const getMyInvitesController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const invites = await getMyInvitesService(userId);
    return res.status(HTTPSTATUS.OK).json({
        message: "Invites fetched successfully",
        invites
    });
});

export const respondToInviteController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const schema = z.object({
        action: z.enum(["accept", "decline"])
    });
    const { action } = schema.parse(req.body);
    
    const result = await respondToInviteService(id, userId, action as "accept" | "decline");
    
    return res.status(HTTPSTATUS.OK).json(result);
});
