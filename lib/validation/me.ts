import { z } from 'zod';

export const updateMeSchema = z.object({
  preferredDistrictId: z.number().int().positive().nullable().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
