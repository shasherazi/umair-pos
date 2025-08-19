import { z } from "zod";

export const salesmanCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  storeId: z.number().int().positive(),
});

export type SalesmanCreateInput = z.infer<typeof salesmanCreateSchema>;

export const salesmanPatchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
});

export type SalesmanPatchInput = z.infer<typeof salesmanPatchSchema>;
