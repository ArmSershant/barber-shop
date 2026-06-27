import { z } from 'zod';

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  preferredDistrictId: z.number().int().positive().nullable().optional(),
  newsletterOptIn: z.boolean().optional(),
  newsletterLang: z.enum(['hy', 'en', 'ru']).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
