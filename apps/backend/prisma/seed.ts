import { matchesGlob } from 'path';
import prisma from '../src/prisma';

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.store.deleteMany();

  // Store data
  const stores = [
    {
      name: 'Goldfish',
      passwordHash: '$2y$10$/ImKXzNYbxvlPFykI8v7x.0DmZnNuGfef/Hfe29g86O8.zvYzShfC'
    },
    {
      name: 'Friends Foods',
      passwordHash: '$2y$10$/ImKXzNYbxvlPFykI8v7x.0DmZnNuGfef/Hfe29g86O8.zvYzShfC'
    },
  ];

  // Shop data for each store
  const shops = [
    [
      { name: 'Goldfish Downtown' },
      { name: 'Goldfish Uptown' },
    ],
    [
      { name: 'Friends Foods City Center' },
      { name: 'Friends Foods Suburb' },
    ],
  ];

  // Product data for each store
  const products = [
    [
      { name: 'Ballpoint Pen', price: 50, stock: 100 },
      { name: 'Notebook', price: 250, stock: 50 },
      { name: 'Lead Pencil', price: 30, stock: 200 },
      { name: 'Eraser', price: 15, stock: 0 },
      { name: 'Ruler', price: 80, stock: 40 },
    ],
    [
      { name: 'Lays (small)', price: 50, stock: 100 },
      { name: 'Kurkure (small)', price: 50, stock: 100 },
      { name: 'Slanty (small)', price: 30, stock: 100 },
      { name: 'Cocomo', price: 50, stock: 100 },
      { name: 'Nimko (small)', price: 40, stock: 100 },
    ],
  ];

  for (let i = 0; i < stores.length; i++) {
    // Create store with products and shops
    const store = await prisma.store.create({
      data: {
        name: stores[i].name,
        passwordHash: stores[i].passwordHash,
        products: { create: products[i] },
        shops: { create: shops[i] },
      },
      include: { products: true, shops: true },
    });

    console.log(`Created store: ${store.name}`);

    // Generate 10 random sales for each store
    for (let s = 0; s < 10; s++) {
      const shop = store.shops[Math.floor(Math.random() * store.shops.length)];
      const saleType = Math.random() > 0.5 ? 'CASH' : 'CREDIT';
      const discount = Math.floor(Math.random() * 50);
      const productCount = Math.floor(Math.random() * store.products.length) + 1;
      const selectedProducts = [...store.products]
        .sort(() => 0.5 - Math.random())
        .slice(0, productCount);

      let total = 0;
      const saleItemsData = selectedProducts.map(p => {
        const quantity = Math.floor(Math.random() * 5) + 1;
        total += p.price * quantity;
        return {
          productId: p.id,
          quantity,
          price: p.price,
        };
      });

      total -= discount;
      if (total < 0) total = 0;

      await prisma.sale.create({
        data: {
          storeId: store.id,
          shopId: shop.id,
          saleType,
          discount,
          total,
          saleItems: { create: saleItemsData },
        },
      });
    }

    console.log(`Created 10 random sales for store: ${store.name}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
