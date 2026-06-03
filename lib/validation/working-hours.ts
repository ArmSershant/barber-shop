import { z } from 'zod';

// weekday: 0=Mon .. 6=Sun; minutes are minutes-from-midnight (0..1440).
const intervalSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((i) => i.startMinute < i.endMinute, {
    message: 'End must be after start',
    path: ['endMinute'],
  });

export const workingHoursSchema = z.object({
  intervals: z.array(intervalSchema).max(50),
});

export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
