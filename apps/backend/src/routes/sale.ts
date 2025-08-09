import { Router } from 'express';
import prisma from '../prisma';
import { saleCreateSchema } from '@shared/validation/sale';

const router = Router();

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get current month sales
router.get('/current-month', async (req, res) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  try {
    const sales = await prisma.sale.findMany({
      where: {
        saleTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      // sort by reverse chronological order
      orderBy: { saleTime: 'desc' },
      include: {
        saleItems: true,
      },
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get sale by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid sale ID' });
  }

  try {
    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


// Create a new sale
router.post('/', async (req, res) => {
  const parseResult = saleCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  const { storeId, items, discount = 0, saleTime } = parseResult.data;

  try {
    // Fetch all products in one query
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Calculate total price
    let total = 0;
    const saleItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Apply discount
    total = total * (1 - discount / 100);

    // Create sale and sale items in a transaction
    const sale = await prisma.sale.create({
      data: {
        storeId,
        saleTime: saleTime ? new Date(saleTime) : new Date(),
        discount,
        total,
        saleItems: {
          create: saleItemsData,
        },
      },
      include: {
        saleItems: true,
      },
    });

    res.status(201).json({ ...sale, total });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});
export default router;
