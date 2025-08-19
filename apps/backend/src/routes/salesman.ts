import { Router } from "express";
import prisma from "../prisma";
import {
  salesmanCreateSchema,
  salesmanPatchSchema,
} from "@shared/validation/salesman";

const router = Router();

// GET all salesmen (optionally filter by storeId)
router.get("/", async (req, res) => {
  const { storeId } = req.query;
  try {
    const salesmen = await prisma.salesman.findMany({
      where: storeId ? { storeId: Number(storeId) } : undefined,
    });
    res.json(salesmen);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET salesman by ID
router.get("/:id", async (req, res) => {
  const salesmanId = Number(req.params.id);
  if (isNaN(salesmanId)) {
    return res.status(400).json({ error: "Invalid salesman ID" });
  }
  try {
    const salesman = await prisma.salesman.findUnique({ where: { id: salesmanId } });
    if (!salesman) return res.status(404).json({ error: "Salesman not found" });
    res.json(salesman);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST create new salesman
router.post("/", async (req, res) => {
  const parseResult = salesmanCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }
  const { name, storeId } = parseResult.data;
  try {
    const salesman = await prisma.salesman.create({
      data: {
        name,
        storeId,
      },
    });
    res.status(201).json(salesman);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// PATCH update salesman name
router.patch("/:id", async (req, res) => {
  const salesmanId = Number(req.params.id);
  if (isNaN(salesmanId)) {
    return res.status(400).json({ error: "Invalid salesman ID" });
  }
  const parseResult = salesmanPatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }
  const { name } = parseResult.data;
  if (!name) {
    return res.status(400).json({ error: "No valid fields to update" });
  }
  try {
    const salesman = await prisma.salesman.update({
      where: { id: salesmanId },
      data: { name },
    });
    res.json(salesman);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
