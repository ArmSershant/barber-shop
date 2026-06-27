import { z } from 'zod';

// Editable page URL: lowercase letters/digits with single hyphens between them.
export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');

export const createShopSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  districtId: z.number().int().positive().optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  instagram: z.string().trim().max(80).optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  requiresApproval: z.boolean().optional(),
});
// `slug` is auto-generated on create; editable only via update.
export const updateShopSchema = createShopSchema.partial().extend({ slug: slugField.optional() });

export const createBarberSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  districtId: z.number().int().positive().optional(),
  photoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  requiresApproval: z.boolean().optional(),
});
export const updateBarberSchema = createBarberSchema.partial().extend({ slug: slugField.optional() });

// Form schemas: create fields plus the optional editable slug. Used by the
// dashboard forms for both create (slug ignored server-side) and edit.
export const shopFormSchema = createShopSchema.extend({ slug: slugField.optional() });
export const barberFormSchema = createBarberSchema.extend({ slug: slugField.optional() });

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type ShopFormInput = z.infer<typeof shopFormSchema>;
export type BarberFormInput = z.infer<typeof barberFormSchema>;
