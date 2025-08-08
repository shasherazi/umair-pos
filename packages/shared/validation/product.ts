import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().nonnegative(),
  storeId: z.number().int().positive(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
