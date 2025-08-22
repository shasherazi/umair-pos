import { Router } from "express";
import PDFDocument from "pdfkit";
import prisma from "../prisma";
import { saleCreateSchema } from "@shared/validation/sale";
import { formatDateTime } from "@shared/utils/formatDateTimeForInvoice";
import { formatMoney } from "@shared/utils/formatMoney";

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

// Get current month sales
router.get("/current-month", async (req, res) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  try {
    const sales = await prisma.sale.findMany({
      where: {
        saleTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      // sort by reverse chronological order
      orderBy: { saleTime: "desc" },
      include: {
        saleItems: true,
        shop: {
          select: {
            name: true,
          },
        },
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
  const shopDataMaxWidth = 200;
  const invoiceNumberFontSize = 10;
  const saleDateFontSize = 10;
  const salesManFontSize = 10;

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
    columnStyles: [50, "*", 60, "*", "*", "*", "*"],
    rowStyles: (rowIndex) => {
      if (rowIndex === tableRows.length + 1) {
        return { backgroundColor: "#f0f0f0", font: { src: "Helvetica-Bold" } };
      }
      if (rowIndex === 0) {
        return { font: { src: "Helvetica-Bold" } };
      }
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
    ],
  });

  // signature lines
  doc
    .moveDown(4)
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
  const x = doc.page.width - margin - targetWidth + 100;
  const y = doc.y + 20;

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

    // Apply discount (percentage)
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

export default router;
