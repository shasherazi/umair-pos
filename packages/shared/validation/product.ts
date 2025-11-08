import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().nonnegative(),
  storeId: z.number().int().positive(),
  stock: z.number().int().nonnegative().optional(),
});


export const productPatchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  price: z.number().nonnegative().optional(),
  stockChange: z.number().int().positive("Stock change must be a positive integer").optional(),
});

export type ProductPatchInput = z.infer<typeof productPatchSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
