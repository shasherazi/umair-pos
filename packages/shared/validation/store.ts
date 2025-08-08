import { z } from 'zod';

export const storeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
