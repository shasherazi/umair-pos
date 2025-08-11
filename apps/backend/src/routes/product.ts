import { Router } from 'express';
import prisma from '../prisma';
import { productCreateSchema } from '@shared/validation/product';

const router = Router();

function getDateRange(period: string) {
  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;

  switch (period) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "yesterday":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "last7days":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "thismonth":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "lastmonth":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "thisyear":
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case "alltime":
    default:
      from = undefined;
      to = undefined;
      break;
  }
  return { from, to };
}

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/sales", async (req, res) => {
  const { period, from, to, storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ error: "storeId is required" });
  }

  // Determine date range
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (period && typeof period === "string") {
    const range = getDateRange(period);
    dateFrom = range.from;
    dateTo = range.to;
  } else if (from && to && typeof from === "string" && typeof to === "string") {
    dateFrom = new Date(from);
    dateTo = new Date(to);
  }

  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { storeId: Number(storeId) },
    });

    // For each product, get sales in the date range
    const result = await Promise.all(
      products.map(async (product) => {
        const saleItems = await prisma.saleItem.findMany({
          where: {
            productId: product.id,
            sale: {
              saleTime: dateFrom && dateTo
                ? { gte: dateFrom, lt: dateTo }
                : undefined,
            },
          },
        });

        const unitsSold = saleItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const amountMade = saleItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          unitsSold,
          amountMade,
        };
      })
    );

    // Sort by unitsSold descending
    result.sort((a, b) => b.unitsSold - a.unitsSold);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


// Create a new product
router.post('/', async (req, res) => {
  const parseResult = productCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  const { name, price, storeId, stock = 0 } = parseResult.data;

  try {
    const product = await prisma.product.create({
      data: { name, price, storeId, stock },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Product not found' });
  }
});

export default router;
