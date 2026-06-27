import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1).max(10),
  startsAt: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
  guest: z
    .object({
      name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(3).max(40),
      // Required so every guest receives an emailed confirmation + manage link.
      email: z.string().trim().email(),
    })
    .optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  token: z.string().optional(),
  reason: z.string().trim().max(200).optional(),
});
