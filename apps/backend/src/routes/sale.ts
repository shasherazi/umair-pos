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
        shop: {
          select: {
            name: true,
          },
        }
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
    const sale = await prisma.sale.findUnique(
      {
        where: { id },
        include: {
          saleItems: {
            include: {
              product: true,
            }
          },
          shop: {
            select: {
              name: true,
            },
          },
        }
      });
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

  const { storeId, shopId, items, discount = 0, saleTime, saleType = "CASH" } = parseResult.data;

  try {
    // Fetch all products in one query
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Check stock for each item
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // Calculate total price using the price provided in each sale item
    let total = 0;
    const saleItemsData = items.map(item => {
      total += item.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // Apply discount (percentage)
    total = total * (1 - discount / 100);

    // Transaction: create sale, sale items, update product stock, update shop
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const createdSale = await tx.sale.create({
        data: {
          storeId,
          shopId,
          saleTime: saleTime ? new Date(saleTime) : new Date(),
          discount,
          total,
          saleType,
          saleItems: {
            create: saleItemsData,
          },
        },
        include: {
          saleItems: true,
        },
      });

      // Update stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Update shop: set firstSaleDate if null, and update cashPaid or credit
      if (shopId) {
        const shop = await tx.shop.findUnique({ where: { id: shopId } });
        if (shop) {
          const updateData: any = {};
          if (!shop.firstSaleDate) {
            updateData.firstSaleDate = createdSale.saleTime;
          }
          if (saleType === "CASH") {
            updateData.cashPaid = { increment: total };
          } else if (saleType === "CREDIT") {
            updateData.credit = { increment: total };
          }
          if (Object.keys(updateData).length > 0) {
            await tx.shop.update({
              where: { id: shopId },
              data: updateData,
            });
          }
        }
      }

      return createdSale;
    });

    res.status(201).json({ ...sale, total });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
