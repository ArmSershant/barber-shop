import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  districtId: z.number().int().positive().optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  instagram: z.string().trim().max(80).optional(),
  logoUrl: z.string().url().optional(),
});
export const updateShopSchema = createShopSchema.partial();

export const createBarberSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  districtId: z.number().int().positive().optional(),
  photoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});
export const updateBarberSchema = createBarberSchema.partial();

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
