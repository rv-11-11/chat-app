import { z } from "zod";

export const sendMessageSchema = z
  .object({
    chatId: z.string().trim().min(1),
    content: z.string().trim().optional(),
    image: z.string().trim().optional(),
    video: z
      .object({
        data: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
      .optional(),
    replyToId: z.string().trim().optional(),
  })
  .refine((data) => data.content || data.image || data.video, {
    message: "Either content, image or video must be provided",
    path: ["content"],
  });
