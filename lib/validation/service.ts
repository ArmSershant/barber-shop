import { z } from 'zod';
import { SERVICE_TYPES } from '@/lib/service-types';

const baseService = z.object({
  type: z.enum(SERVICE_TYPES),
  // Free-text name is only used (and required) when type === 'other'.
  // Empty strings from form inputs are treated as "not provided".
  name: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().min(2).max(120).optional(),
  ),
  description: z.string().trim().max(1000).optional(),
  durationMin: z.number().int().min(5).max(600),
  priceAmd: z.number().int().min(0).max(10_000_000),
});

export const createServiceSchema = baseService.refine(
  (v) => v.type !== 'other' || Boolean(v.name),
  { message: 'Name is required for a custom service', path: ['name'] },
);
export const updateServiceSchema = baseService.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
