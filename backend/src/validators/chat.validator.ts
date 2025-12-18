import { z } from "zod";

export const createChatSchema = z.object({
  participantId: z.string().trim().min(1).optional(),
  isGroup: z.boolean().optional(),
  participants: z.array(z.string().trim().min(1)).optional(),
  groupName: z.string().trim().min(1).optional(),
  groupDescription: z.string().trim().max(500).optional(),
  groupUsername: z.string().trim().min(3).max(30).toLowerCase().regex(/^[a-z0-9_]+$/).optional(),
  groupRules: z.string().trim().max(1000).optional(),
  groupTopic: z.string().trim().max(100).optional(),
  groupCategory: z.enum(["study", "gaming", "work", "hobbies", "sports", "entertainment", "other"]).optional(),
  isPublic: z.boolean().optional(),
  allowInviteLinkJoin: z.boolean().optional(),
  icon: z.string().optional(),
});

export const chatIdSchema = z.object({
  id: z.string().trim().min(1),
});
