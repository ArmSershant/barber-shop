import { z } from 'zod';

// Roles a user may self-assign at registration. `admin` is never self-assignable.
export const registrableRoles = ['customer', 'barber', 'shop_owner'] as const;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(registrableRoles).default('customer'),
  newsletterOptIn: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({ token: z.string().min(1) });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
