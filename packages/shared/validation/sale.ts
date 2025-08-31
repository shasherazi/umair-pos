import { z } from 'zod';

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
});

export const saleCreateSchema = z.object({
  storeId: z.number().int().positive(),
  shopId: z.number().int().positive(),
  salesmanId: z.number().int().positive(),
  items: z.array(saleItemSchema).min(1, "At least one product is required"),
  discount: z.number().nonnegative().optional(),
  saleTime: z.string().datetime().optional(),
  saleType: z.enum(['CASH', 'CREDIT']).default('CASH'),
});

export const saleEditSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().nonnegative(),
      price: z.number().nonnegative(),
    })
  ).min(1, "At least one product is required"),
  discount: z.number().nonnegative().optional(),
  saleType: z.enum(['CASH', 'CREDIT']).optional(),
  salesmanId: z.number().int().positive().optional(),
  shopId: z.number().int().positive(),
});

export type SaleEditInput = z.infer<typeof saleEditSchema>;
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
