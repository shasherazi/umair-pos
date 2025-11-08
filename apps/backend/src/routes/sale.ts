import { Router } from "express";
import PDFDocument from "pdfkit";
import prisma from "../prisma";
import { saleCreateSchema, saleEditSchema } from "@shared/validation/sale";
import { formatDateTime } from "@shared/utils/formatDateTimeForInvoice";
import { formatMoney } from "@shared/utils/formatMoney";
import { getDateRange } from "@shared/utils/getDateRange";
import { size } from "pdfkit/js/page";

const router = Router();

// Get all sales
router.get("/", async (req, res) => {
  try {
    const sales = await prisma.sale.findMany();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get ranged sales
router.get("/report", async (req, res) => {
  const { storeId, period, from, to } = req.query;

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
    const sales = await prisma.sale.findMany({
      where: {
        storeId: Number(storeId),
        ...(dateFrom && dateTo
          ? { saleTime: { gte: dateFrom, lt: dateTo } }
          : {}),
      },
      orderBy: { saleTime: "desc" },
      include: {
        saleItems: true,
        shop: { select: { name: true, address: true, phone: true } },
        salesman: { select: { name: true } },
      },
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get sale by ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid sale ID" });
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        shop: {
          select: {
            name: true,
          },
        },
        salesman: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/:id/invoice-pdf", async (req, res) => {
  const saleId = Number(req.params.id);
  if (isNaN(saleId)) {
    return res.status(400).json({ error: "Invalid sale ID" });
  }

  // Fetch sale with store information
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      store: true,
      shop: true,
      salesman: true,
      saleItems: {
        include: { product: true },
      },
    },
  });

  if (!sale || !sale.store) {
    return res.status(404).json({ error: "Sale or store not found" });
  }

  // Set headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${saleId}.pdf"`
  );

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 20 });
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;

  const storeNameFontSize = 20;
  const storeAddressFontSize = 12;
  const shopNameFontSize = 10;
  const shopAddressFontSize = 10;
  const shopPhoneFontSize = 10;
  const shopDataMaxWidth = 200;
  const invoiceNumberFontSize = 10;
  const saleDateFontSize = 10;
  const salesManFontSize = 10;
  const tableHeaderFontSize = 8;
  const tableRowFontSize = 8;

  const lineLength = pageWidth / 3;
  const leftLineX = margin;
  const rightLineX = pageWidth - margin - lineLength;
  const signatureLabelFontSize = 8;

  // Store name (centered, large font)
  doc
    .fontSize(storeNameFontSize)
    .font("Helvetica-Bold")
    .text(sale.store.name, { align: "center" });

  // Store address (centered, smaller font, below name)
  doc
    .font("Helvetica")
    .fontSize(storeAddressFontSize)
    .text(sale.store.address, { align: "center" });

  doc.moveDown(0.5);
  let currentY = doc.y;

  doc.fontSize(shopNameFontSize).text(sale.shop.name, margin, currentY, {
    width: shopDataMaxWidth,
    align: "left",
  });

  doc.fontSize(invoiceNumberFontSize).text(
    `Invoice #${saleId}`,
    pageWidth - margin - shopDataMaxWidth, // x position for right block
    currentY,
    { width: shopDataMaxWidth, align: "right" }
  );

  currentY = doc.y;

  doc.fontSize(shopAddressFontSize).text(sale.shop.address, margin, doc.y, {
    width: shopDataMaxWidth,
    align: "left",
  });

  doc.fontSize(saleDateFontSize).text(
    `Date: ${formatDateTime(sale.saleTime.toISOString())}`,
    pageWidth - margin - shopDataMaxWidth, // x position for right block
    currentY,
    { width: shopDataMaxWidth, align: "right" }
  );

  currentY = doc.y;

  doc.fontSize(shopPhoneFontSize).text(`Phone: ${sale.shop.phone}`, margin, doc.y, {
    width: shopDataMaxWidth,
    align: "left",
  });

  doc.fontSize(salesManFontSize).text(
    `Delivery Man: ${sale.salesman.name}`,
    pageWidth - margin - shopDataMaxWidth, // x position for right block
    currentY,
    { width: shopDataMaxWidth, align: "right" }
  );

  // table
  const columnHeaders = [
    "Sr. No.",
    "Product",
    "Quantity",
    "TP Rate",
    "Gross Amount",
    "Discount",
    "Net Amount",
  ];

  const saleDiscount = sale.discount ?? 0;

  const tableRows = sale.saleItems.map((item, idx) => {
    const grossAmount = item.price * item.quantity;
    const discountAmount = grossAmount * (saleDiscount / 100);
    const netAmount = grossAmount - discountAmount;

    return [
      (idx + 1).toString(),
      item.product.name,
      item.quantity.toString(),
      formatMoney(item.price),
      formatMoney(grossAmount),
      formatMoney(discountAmount),
      formatMoney(netAmount)
    ];
  });

  const totalItems = sale.saleItems.length;
  const totalQuantity = sale.saleItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalGross = sale.saleItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalDiscount = totalGross * (saleDiscount / 100);
  const totalNet = totalGross - totalDiscount;

  const grandTotalRow = [
    totalQuantity.toString(),
    "", // TP Rate (skip)
    formatMoney(totalGross),
    formatMoney(totalDiscount),
    formatMoney(totalNet)
  ];

  doc.table({
    position: { x: margin, y: doc.y + 20 },
    columnStyles: [30, 150, 40, "*", "*", "*", "*"],
    rowStyles: (rowIndex) => {
      if (rowIndex === tableRows.length + 1) {
        return { backgroundColor: "#f0f0f0", font: { src: "Helvetica-Bold", size: tableHeaderFontSize } };
      }
      if (rowIndex === 0) {
        return { font: { src: "Helvetica-Bold", size: tableHeaderFontSize } };
      }
      return { font: { src: "Helvetica", size: tableRowFontSize } };
    },
    data: [
      columnHeaders,
      ...tableRows,
      [
        {
          colSpan: 2,
          text: `${totalItems} items`,
          font: { src: "Helvetica-Bold" },
        },
        ...grandTotalRow,
      ],
      [
        { colSpan: 7, text: " ", backgroundColor: "#999" },
      ],
      [
        {
          colSpan: 5,
          rowSpan: 4,
          text: "",
        },
        { text: "Before Discount", font: { src: "Helvetica-Bold" } },
        { text: formatMoney(totalGross), font: { src: "Helvetica-Bold" } },
      ],
      [
        { text: "Discount", font: { src: "Helvetica-Bold" } },
        {
          text: `${formatMoney(totalDiscount)} (${saleDiscount}%)`,
          font: { src: "Helvetica-Bold" }
        },
      ],
      [
        { text: "After Discount", font: { src: "Helvetica-Bold" } },
        { text: formatMoney(totalNet), font: { src: "Helvetica-Bold" } },
      ],
      [
        { text: "Grand Total", font: { src: "Helvetica-Bold" } },
        { text: formatMoney(totalNet), font: { src: "Helvetica-Bold" } },
      ],
    ],
  });

  // signature lines
  doc
    .moveDown(6)
    .fontSize(signatureLabelFontSize)
    .text(sale.salesman.name, leftLineX, doc.y, { align: "left" });

  doc
    .moveTo(leftLineX, doc.y)
    .lineTo(leftLineX + lineLength, doc.y)
    .stroke();

  currentY = doc.y;

  doc
    .fontSize(signatureLabelFontSize)
    .text("Order Booker", leftLineX, doc.y + 2, { align: "left" });

  doc
    .moveTo(rightLineX, currentY)
    .lineTo(rightLineX + lineLength, currentY)
    .stroke();

  doc
    .fontSize(signatureLabelFontSize)
    .text("Shopkeeper", rightLineX, currentY + 2, { align: "right" });

  // urdu lines
  const targetWidth = doc.page.width * 0.6;
  const imageHeight = 224;
  const bottomMargin = doc.page.margins.bottom || 20;
  const x = doc.page.width - margin - targetWidth;
  let y = doc.y + 25;

  if (y + imageHeight > doc.page.height - bottomMargin) {
    doc.addPage();
    y = doc.y; // reset y to top (current doc.y after addPage)
  }

  doc
    .image("assets/urdu.png", x, y, {
      width: targetWidth,
      align: "right",
    });

  doc.pipe(res);
  doc.end();
});

// Create a new sale
router.post("/", async (req, res) => {
  const parseResult = saleCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  const {
    storeId,
    shopId,
    salesmanId,
    items,
    discount = 0,
    saleTime,
    saleType = "CASH",
  } = parseResult.data;

  try {
    // Fetch all products in one query
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: "One or more products not found" });
    }

    // Check stock for each item
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // Calculate total price using the price provided in each sale item
    let total = 0;
    const saleItemsData = items.map((item) => {
      total += item.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // Apply discount (percentage) and round up to integer
    total = total * (1 - discount / 100);

    // Transaction: create sale, sale items, update product stock, update shop
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const createdSale = await tx.sale.create({
        data: {
          storeId,
          shopId,
          salesmanId,
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

router.patch("/:id", async (req, res) => {
  const saleId = Number(req.params.id);
  if (isNaN(saleId)) {
    return res.status(400).json({ error: "Invalid sale ID" });
  }

  // Fetch sale
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { saleItems: true, shop: true },
  });
  if (!sale) return res.status(404).json({ error: "Sale not found" });

  // Only allow edit if sale is from today
  const saleDate = new Date(sale.saleTime);
  const now = new Date();
  const isSameDay =
    saleDate.getFullYear() === now.getFullYear() &&
    saleDate.getMonth() === now.getMonth() &&
    saleDate.getDate() === now.getDate();
  if (!isSameDay) {
    return res.status(403).json({ error: "Sale can only be edited on the same day" });
  }

  // Validate input
  const parseResult = saleEditSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  const {
    items,
    discount = sale.discount,
    saleType = sale.saleType,
    salesmanId = sale.salesmanId,
    shopId = sale.shopId
  } = parseResult.data;

  // Validate shop belongs to same store
  if (shopId !== sale.shopId) {
    const newShop = await prisma.shop.findUnique({
      where: { id: shopId }
    });
    if (!newShop || newShop.storeId !== sale.storeId) {
      return res.status(400).json({ error: "Invalid shop for this store" });
    }
  }

  // Fetch products with current stock
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: sale.storeId },
  });
  if (products.length !== items.length) {
    return res.status(400).json({ error: "One or more products not found" });
  }

  // Calculate stock changes for validation
  // For each product, calculate: current_stock + old_quantity - new_quantity
  const stockValidations: any = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} not found` });
    }

    // Find the old quantity for this product (if it existed in the original sale)
    const oldSaleItem = sale.saleItems.find((si) => si.productId === item.productId);
    const oldQuantity = oldSaleItem ? oldSaleItem.quantity : 0;

    // Calculate what the stock would be after the edit
    const effectiveStock = product.stock + oldQuantity - item.quantity;

    if (effectiveStock < 0) {
      return res.status(400).json({
        error: `Not enough stock for product "${product.name}". Available after restoring old quantity: ${product.stock + oldQuantity}, Requested: ${item.quantity}`,
      });
    }

    stockValidations.push({
      productId: item.productId,
      oldQuantity,
      newQuantity: item.quantity,
      stockChange: oldQuantity - item.quantity // positive means stock increase, negative means decrease
    });
  }

  // Also handle products that were in the old sale but not in the new sale (they get fully restored)
  for (const oldItem of sale.saleItems) {
    const stillInSale = items.some(item => item.productId === oldItem.productId);
    if (!stillInSale) {
      stockValidations.push({
        productId: oldItem.productId,
        oldQuantity: oldItem.quantity,
        newQuantity: 0,
        stockChange: oldItem.quantity // full restoration
      });
    }
  }

  // Calculate new total
  let total = 0;
  const saleItemsData = items.map((item) => {
    total += item.price * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    };
  });
  total = total * (1 - discount / 100);

  // Transaction: update sale, sale items, update product stock, update shops
  const updatedSale = await prisma.$transaction(async (tx) => {
    // Delete previous sale items
    await tx.saleItem.deleteMany({ where: { saleId } });

    // Create new sale items
    await Promise.all(
      saleItemsData.map((item) =>
        tx.saleItem.create({
          data: { ...item, saleId },
        })
      )
    );

    // Update sale
    const saleUpdate = await tx.sale.update({
      where: { id: saleId },
      data: {
        discount,
        total,
        saleType,
        salesmanId,
        shopId,
      },
      include: {
        saleItems: true,
        shop: true,
        salesman: true,
      },
    });

    // Update stock based on calculated changes
    for (const validation of stockValidations) {
      if (validation.stockChange !== 0) {
        await tx.product.update({
          where: { id: validation.productId },
          data: { stock: { increment: validation.stockChange } },
        });
      }
    }

    // Update previous shop (decrement old totals) - only if shop changed
    if (sale.shopId !== shopId) {
      const prevShopUpdate: any = {};
      if (sale.saleType === "CASH") {
        prevShopUpdate.cashPaid = { decrement: sale.total };
      } else if (sale.saleType === "CREDIT") {
        prevShopUpdate.credit = { decrement: sale.total };
      }

      if (Object.keys(prevShopUpdate).length > 0) {
        await tx.shop.update({
          where: { id: sale.shopId },
          data: prevShopUpdate,
        });
      }

      // Update new shop (increment new totals)
      const newShopUpdate: any = {};
      if (saleType === "CASH") {
        newShopUpdate.cashPaid = { increment: total };
      } else if (saleType === "CREDIT") {
        newShopUpdate.credit = { increment: total };
      }

      if (Object.keys(newShopUpdate).length > 0) {
        await tx.shop.update({
          where: { id: shopId },
          data: newShopUpdate,
        });
      }
    } else {
      // Same shop, just update the difference
      const totalDifference = total - sale.total;
      const saleTypeChanged = sale.saleType !== saleType;

      if (saleTypeChanged) {
        // Remove from old type, add to new type
        const removeUpdate: any = {};
        const addUpdate: any = {};

        if (sale.saleType === "CASH") {
          removeUpdate.cashPaid = { decrement: sale.total };
        } else if (sale.saleType === "CREDIT") {
          removeUpdate.credit = { decrement: sale.total };
        }

        if (saleType === "CASH") {
          addUpdate.cashPaid = { increment: total };
        } else if (saleType === "CREDIT") {
          addUpdate.credit = { increment: total };
        }

        await tx.shop.update({
          where: { id: shopId },
          data: { ...removeUpdate, ...addUpdate },
        });
      } else if (totalDifference !== 0) {
        // Same type, just update the difference
        const shopUpdate: any = {};
        if (saleType === "CASH") {
          shopUpdate.cashPaid = { increment: totalDifference };
        } else if (saleType === "CREDIT") {
          shopUpdate.credit = { increment: totalDifference };
        }

        if (Object.keys(shopUpdate).length > 0) {
          await tx.shop.update({
            where: { id: shopId },
            data: shopUpdate,
          });
        }
      }
    }

    return saleUpdate;
  });

  res.json(updatedSale);
});

router.delete("/:id", async (req, res) => {
  const saleId = Number(req.params.id);
  if (isNaN(saleId)) {
    return res.status(400).json({ error: "Invalid sale ID" });
  }

  // Fetch sale with items and shop
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { saleItems: true, shop: true },
  });
  if (!sale) return res.status(404).json({ error: "Sale not found" });

  // Only allow delete if sale is from today
  const saleDate = new Date(sale.saleTime);
  const now = new Date();
  const isSameDay =
    saleDate.getFullYear() === now.getFullYear() &&
    saleDate.getMonth() === now.getMonth() &&
    saleDate.getDate() === now.getDate();
  if (!isSameDay) {
    return res.status(403).json({ error: "Sale can only be deleted on the same day" });
  }

  // Transaction: restore stock, update shop, delete sale items, delete sale
  await prisma.$transaction(async (tx) => {
    // Restore stock for each sale item
    for (const item of sale.saleItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Update shop cashPaid/credit
    const shopUpdate: any = {};
    if (sale.saleType === "CASH") {
      shopUpdate.cashPaid = { decrement: sale.total };
    } else if (sale.saleType === "CREDIT") {
      shopUpdate.credit = { decrement: sale.total };
    }
    if (Object.keys(shopUpdate).length > 0) {
      await tx.shop.update({
        where: { id: sale.shopId },
        data: shopUpdate,
      });
    }

    // Delete sale items
    await tx.saleItem.deleteMany({ where: { saleId } });

    // Delete sale
    await tx.sale.delete({ where: { id: saleId } });
  });

  res.json({ success: true });
});

export default router;
