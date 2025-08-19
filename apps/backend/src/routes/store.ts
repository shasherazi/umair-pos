import { Router } from 'express';
import prisma from '../prisma';
import { storeCreateSchema } from '@shared/validation/store';
import bcrypt from "bcryptjs";

const router = Router();

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany(
      {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      }
    );
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
    const store = await prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/login", async (req, res) => {
  const { storeId, password } = req.body;
  if (!storeId || !password) {
    return res.status(400).json({ error: "storeId and password are required" });
  }
  const store = await prisma.store.findUnique({ where: { id: Number(storeId) } });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const bcrypt = require("bcryptjs");
  const valid = await bcrypt.compare(password, store.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid password" });

  // Don't return passwordHash
  const { passwordHash, ...storeData } = store;
  res.json(storeData);
});

// POST create new store
router.post("/", async (req, res) => {
  const parseResult = storeCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }
  const { name, password } = parseResult.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const store = await prisma.store.create({
      data: {
        name,
        passwordHash,
      },
    });
    // Do not return passwordHash in response
    const { passwordHash: _, ...storeWithoutHash } = store;
    res.status(201).json(storeWithoutHash);
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

// Get salesmen under a store, with total sales, total credit, and units sold
router.get('/:id/salesmen', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid store ID' });
  }

  try {
    // Get all salesmen for the store
    const salesmen = await prisma.salesman.findMany({
      where: { storeId: id },
    });

    // For each salesman, calculate total sales, total credit, and units sold
    const result = await Promise.all(
      salesmen.map(async (salesman) => {
        // Get all sales for this salesman, including sale items
        const sales = await prisma.sale.findMany({
          where: { salesmanId: salesman.id },
          select: {
            total: true,
            saleType: true,
            saleItems: {
              select: {
                quantity: true,
              },
            },
          },
        });

        let totalSales = 0;
        let totalCredit = 0;
        let unitsSold = 0;
        for (const sale of sales) {
          totalSales += sale.total;
          if (sale.saleType === "CREDIT") {
            totalCredit += sale.total;
          }
          unitsSold += sale.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        }

        return {
          id: salesman.id,
          name: salesman.name,
          totalSales,
          totalCredit,
          unitsSold,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
