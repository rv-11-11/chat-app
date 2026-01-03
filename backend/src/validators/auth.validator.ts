import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1);

export const passwordSchema = z.string().trim().min(1);

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: emailSchema,
  password: passwordSchema,
  avatar: z.string().optional(),
  phone: z.string().trim().min(1).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const googleLoginSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1),
  googleId: z.string().trim().min(1),
  avatar: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(3).max(30).optional(),
  email: emailSchema,
  phone: z.string().trim().min(1).optional(),
  avatar: z.string().optional(),
  isOnlineVisible: z.boolean().optional(),
  readReceipts: z.boolean().optional(),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type GoogleLoginSchemaType = z.infer<typeof googleLoginSchema>;
export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;
