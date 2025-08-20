import { Router } from "express";
import prisma from "../prisma";
import { shopCreateSchema, shopPatchSchema } from "@shared/validation/shop";
import { getDateRange } from '@shared/utils/getDateRange';

const router = Router();

// GET all shops
router.get("/", async (req, res) => {
  try {
    const shops = await prisma.shop.findMany();
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/shops/sales?storeId=1&period=thismonth
router.get("/sales", async (req, res) => {
  const { storeId, period, from, to } = req.query;

  if (!storeId) {
    return res.status(400).json({ error: "storeId is required" });
  }

  // Get date range
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
    // Get all shops for the store
    const shops = await prisma.shop.findMany({
      where: { storeId: Number(storeId) },
    });

    // For each shop, get sales in the date range
    const result = await Promise.all(
      shops.map(async (shop) => {
        const sales = await prisma.sale.findMany({
          where: {
            shopId: shop.id,
            saleTime: dateFrom && dateTo
              ? { gte: dateFrom, lt: dateTo }
              : undefined,
          },
          include: { saleItems: { include: { product: true } } },
        });

        // Aggregate units sold and amount made
        let unitsSold = 0;
        let amountMade = 0;
        const productSales: Record<number, { name: string; quantity: number }> = {};

        for (const sale of sales) {
          for (const item of sale.saleItems) {
            unitsSold += item.quantity;
            amountMade += item.price * item.quantity;
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                name: item.product.name,
                quantity: 0,
              };
            }
            productSales[item.productId].quantity += item.quantity;
          }
        }

        // Find most sold item
        let mostSoldItem: string | null = null;
        let mostSoldQty = 0;
        for (const prodId in productSales) {
          if (productSales[prodId].quantity > mostSoldQty) {
            mostSoldQty = productSales[prodId].quantity;
            mostSoldItem = productSales[prodId].name;
          }
        }

        return {
          id: shop.id,
          name: shop.name,
          firstSaleDate: shop.firstSaleDate,
          cashPaid: shop.cashPaid,
          credit: shop.credit,
          unitsSold,
          amountMade,
          mostSoldItem,
        };
      })
    );

    // Sort by amountMade descending
    result.sort((a, b) => b.amountMade - a.amountMade);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET shop by ID
router.get("/:id", async (req, res) => {
  const shopId = Number(req.params.id);
  if (isNaN(shopId)) {
    return res.status(400).json({ error: "Invalid shop ID" });
  }
  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST create new shop
router.post("/", async (req, res) => {
  const parseResult = shopCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }
  const { name, address, phone, storeId } = parseResult.data;
  try {
    const shop = await prisma.shop.create({
      data: {
        name,
        address,
        phone,
        storeId,
      },
    });
    res.status(201).json(shop);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// PATCH edit shop name and/or decrease credit
router.patch("/:id", async (req, res) => {
  const shopId = Number(req.params.id);

  if (isNaN(shopId)) {
    return res.status(400).json({ error: "Invalid shop ID" });
  }

  const parseResult = shopPatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }
  const { name, address, phone, creditDecrease } = parseResult.data;

  // Validate input
  if (name !== undefined && typeof name !== "string") {
    return res.status(400).json({ error: "Name must be a string" });
  }
  if (
    creditDecrease !== undefined &&
    (typeof creditDecrease !== "number" || creditDecrease < 0)
  ) {
    return res.status(400).json({ error: "creditDecrease must be a non-negative number" });
  }
  if (address !== undefined && typeof address !== "string") {
    return res.status(400).json({ error: "Address must be a string" });
  }
  if (phone !== undefined && typeof phone !== "string") {
    return res.status(400).json({ error: "Phone must be a string" });
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined && name.trim() !== "" && name !== shop.name) {
      updateData.name = name.trim();
    }
    if (address !== undefined && address.trim() !== "" && address !== shop.address) {
      updateData.address = address.trim();
    }
    if (phone !== undefined && phone.trim() !== "" && phone !== shop.phone) {
      updateData.phone = phone.trim();
    }

    if (creditDecrease !== undefined && creditDecrease > 0) {
      if (shop.credit < creditDecrease) {
        return res.status(400).json({ error: "Cannot decrease credit below zero" });
      }
      updateData.credit = { decrement: creditDecrease };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
    });

    res.json(updatedShop);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
