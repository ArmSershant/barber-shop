import { z } from 'zod';

const workingInterval = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((i) => i.startMinute < i.endMinute, { path: ['endMinute'] });

const breakInterval = z
  .object({
    weekday: z.number().int().min(0).max(6).nullable(),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((i) => i.startMinute < i.endMinute, { path: ['endMinute'] });

export const shopDefaultsSchema = z.object({
  workingHours: z.array(workingInterval).max(50),
  breaks: z.array(breakInterval).max(50),
});

export type ShopDefaultsInput = z.infer<typeof shopDefaultsSchema>;
