import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(1000).optional(),
  ),
  photoUrl: z.string().url().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
