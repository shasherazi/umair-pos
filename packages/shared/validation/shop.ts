import { z } from "zod";

export const shopCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  storeId: z.number().int().positive(),
});

export type ShopCreateInput = z.infer<typeof shopCreateSchema>;

export const shopPatchSchema = z.object({
  creditDecrease: z.number().nonnegative("Credit decrease must be non-negative").optional(),
});

export type ShopPatchInput = z.infer<typeof shopPatchSchema>;
