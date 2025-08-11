import { z } from 'zod';

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().nonnegative(),
  price: z.number().nonnegative(), // Accept price from frontend
});

export const saleCreateSchema = z.object({
  storeId: z.number().int().positive(),
  shopId: z.number().int().positive(),
  items: z.array(saleItemSchema).min(1, "At least one product is required"),
  discount: z.number().nonnegative().optional(),
  saleTime: z.string().datetime().optional(),
  saleType: z.enum(['CASH', 'CREDIT']).default('CASH'),
});

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
