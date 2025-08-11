import { Router } from 'express';
import prisma from '../prisma';
import { storeCreateSchema } from '@shared/validation/store';

const router = Router();

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid store ID' });
  }
  try {
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a new store
router.post('/', async (req, res) => {
  const parseResult = storeCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  const { name } = parseResult.data;
  try {
    const store = await prisma.store.create({ data: { name } });
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get products under a store
router.get('/:id/products', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid store ID' });
  }

  try {
    const products = await prisma.product.findMany({
      where: { storeId: id },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get shops under a store
router.get('/:id/shops', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid store ID' });
  }

  try {
    const shops = await prisma.shop.findMany({
      where: { storeId: id },
    });

    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
