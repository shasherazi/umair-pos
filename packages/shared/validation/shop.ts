import { z } from "zod";

export const shopCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  storeId: z.number().int().positive(),
});

export type ShopCreateInput = z.infer<typeof shopCreateSchema>;

export const shopPatchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  creditDecrease: z.number().nonnegative("Credit decrease must be non-negative").optional(),
});

export type ShopPatchInput = z.infer<typeof shopPatchSchema>;
