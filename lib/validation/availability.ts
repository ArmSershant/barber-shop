import { z } from 'zod';

export const timeOffSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.startsAt < v.endsAt, {
    message: 'End must be after start',
    path: ['endsAt'],
  });

export const breakSchema = z
  .object({
    weekday: z.number().int().min(0).max(6).nullable().optional(),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((v) => v.startMinute < v.endMinute, {
    message: 'End must be after start',
    path: ['endMinute'],
  });

export type TimeOffInput = z.infer<typeof timeOffSchema>;
export type BreakInput = z.infer<typeof breakSchema>;
