import { z } from 'zod';

// Roles a user may self-assign at registration. `admin` is never self-assignable.
export const registrableRoles = ['customer', 'barber', 'shop_owner'] as const;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(registrableRoles).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
