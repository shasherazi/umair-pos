import { z } from "zod";

export const storeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
