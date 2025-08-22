import prisma from '../src/prisma';

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.salesman.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.store.deleteMany();

  // Store data
  const stores = [
    {
      name: 'Goldfish',
      address: '123 Ocean Drive, City',
      passwordHash: '$2y$10$/ImKXzNYbxvlPFykI8v7x.0DmZnNuGfef/Hfe29g86O8.zvYzShfC',
    },
    {
      name: 'Friends Foods',
      address: '456 Food Street, Town',
      passwordHash: '$2y$10$/ImKXzNYbxvlPFykI8v7x.0DmZnNuGfef/Hfe29g86O8.zvYzShfC',
    },
  ];

  // Common product pool (100 items)
  const productPool = [
    // Stationery
    { name: 'Ballpoint Pen', price: 50, stock: 100 },
    { name: 'Notebook', price: 250, stock: 50 },
    { name: 'Lead Pencil', price: 30, stock: 200 },
    { name: 'Eraser', price: 15, stock: 100 },
    { name: 'Ruler', price: 80, stock: 40 },
    { name: 'Sharpener', price: 40, stock: 80 },
    { name: 'Marker', price: 120, stock: 60 },
    { name: 'Highlighter', price: 150, stock: 70 },
    { name: 'Glue Stick', price: 100, stock: 90 },
    { name: 'Stapler', price: 300, stock: 30 },
    { name: 'Staples Pack', price: 50, stock: 120 },
    { name: 'Paper Ream', price: 600, stock: 25 },
    { name: 'Folder', price: 200, stock: 45 },
    { name: 'Scissors', price: 180, stock: 35 },
    { name: 'Tape Roll', price: 70, stock: 60 },
    { name: 'Calculator', price: 1500, stock: 20 },
    { name: 'Whiteboard Marker', price: 100, stock: 50 },
    { name: 'Drawing Book', price: 220, stock: 40 },
    { name: 'Crayons Pack', price: 180, stock: 55 },
    { name: 'Watercolors Set', price: 400, stock: 20 },
    { name: 'Paint Brush', price: 90, stock: 70 },
    { name: 'Compass Set', price: 350, stock: 25 },
    { name: 'Protractor', price: 60, stock: 100 },
    { name: 'Set Square', price: 70, stock: 90 },
    { name: 'Board Duster', price: 120, stock: 30 },
    { name: 'Sticky Notes', price: 130, stock: 75 },
    { name: 'Correction Pen', price: 110, stock: 40 },
    { name: 'Binder Clips', price: 140, stock: 85 },
    { name: 'Push Pins Pack', price: 100, stock: 95 },
    { name: 'Clip Board', price: 200, stock: 20 },

    // Snacks
    { name: 'Lays (small)', price: 50, stock: 100 },
    { name: 'Kurkure (small)', price: 50, stock: 100 },
    { name: 'Slanty (small)', price: 30, stock: 100 },
    { name: 'Cocomo', price: 50, stock: 100 },
    { name: 'Nimko (small)', price: 40, stock: 100 },
    { name: 'Oreo Biscuits', price: 100, stock: 120 },
    { name: 'KitKat', price: 120, stock: 60 },
    { name: 'Snickers Bar', price: 150, stock: 40 },
    { name: 'Pringles (small)', price: 250, stock: 35 },
    { name: 'Chocolato', price: 30, stock: 200 },
    { name: 'Candy Mix', price: 20, stock: 300 },

    // Drinks
    { name: 'Pepsi (500ml)', price: 80, stock: 200 },
    { name: 'Coca Cola (500ml)', price: 80, stock: 200 },
    { name: 'Sprite (500ml)', price: 80, stock: 200 },
    { name: '7up (500ml)', price: 80, stock: 200 },
    { name: 'Mineral Water (1.5L)', price: 70, stock: 300 },
    { name: 'Juice Box (Mango)', price: 60, stock: 100 },
    { name: 'Juice Box (Orange)', price: 60, stock: 100 },

    // Electronics
    { name: 'USB Cable', price: 250, stock: 70 },
    { name: 'Earphones', price: 800, stock: 40 },
    { name: 'Phone Charger', price: 1200, stock: 30 },
    { name: 'Power Bank', price: 3000, stock: 15 },
    { name: 'Wireless Mouse', price: 1500, stock: 25 },
    { name: 'Keyboard', price: 2000, stock: 20 },
    { name: 'LED Bulb', price: 300, stock: 100 },
    { name: 'Extension Cable', price: 900, stock: 35 },
    { name: 'Headphones', price: 2500, stock: 20 },
    { name: 'Smartwatch', price: 7000, stock: 10 },

    // Household
    { name: 'Dishwashing Liquid', price: 250, stock: 60 },
    { name: 'Laundry Detergent', price: 500, stock: 40 },
    { name: 'Toilet Paper Roll', price: 50, stock: 200 },
    { name: 'Paper Towels', price: 200, stock: 80 },
    { name: 'Hand Wash Soap', price: 150, stock: 100 },
    { name: 'Shampoo Bottle', price: 450, stock: 50 },
    { name: 'Toothpaste', price: 200, stock: 120 },
    { name: 'Toothbrush', price: 80, stock: 150 },
    { name: 'Bath Towel', price: 600, stock: 40 },
    { name: 'Bucket', price: 350, stock: 30 },
    { name: 'Mop', price: 500, stock: 25 },
    { name: 'Broom', price: 300, stock: 50 },

    // Groceries
    { name: 'Rice (5kg)', price: 1200, stock: 40 },
    { name: 'Flour (10kg)', price: 1500, stock: 35 },
    { name: 'Sugar (5kg)', price: 800, stock: 50 },
    { name: 'Cooking Oil (5L)', price: 2500, stock: 20 },
    { name: 'Tea Pack (500g)', price: 700, stock: 30 },
    { name: 'Salt (1kg)', price: 50, stock: 200 },
    { name: 'Black Pepper (200g)', price: 300, stock: 40 },
    { name: 'Red Chili Powder (200g)', price: 280, stock: 40 },
    { name: 'Daal Chana (1kg)', price: 250, stock: 60 },
    { name: 'Daal Masoor (1kg)', price: 270, stock: 60 },

    // Clothing
    { name: 'T-Shirt', price: 800, stock: 50 },
    { name: 'Jeans', price: 2000, stock: 40 },
    { name: 'Cap', price: 400, stock: 70 },
    { name: 'Socks Pair', price: 150, stock: 100 },
    { name: 'Sneakers', price: 3500, stock: 20 },
    { name: 'Formal Shoes', price: 6000, stock: 15 },
    { name: 'Belt', price: 700, stock: 30 },
    { name: 'Jacket', price: 5000, stock: 10 },
    { name: 'Scarf', price: 500, stock: 25 },
    { name: 'Gloves', price: 450, stock: 30 },

    // Toys
    { name: 'Toy Car', price: 500, stock: 60 },
    { name: 'Doll', price: 700, stock: 40 },
    { name: 'Board Game', price: 1500, stock: 20 },
    { name: 'Football', price: 1200, stock: 30 },
    { name: 'Cricket Bat', price: 2500, stock: 15 },
    { name: 'Basketball', price: 1800, stock: 20 },
    { name: 'Ludo', price: 300, stock: 50 },
    { name: 'Puzzle', price: 800, stock: 35 },
    { name: 'Remote Control Car', price: 3500, stock: 10 },
    { name: 'Lego Set', price: 7000, stock: 8 },
  ];

  // Shops (5 per store)
  const shops = [
    [
      { name: 'Goldfish Downtown', address: '123 Main St, Downtown', phone: '123-456-7890' },
      { name: 'Goldfish Uptown', address: '456 Elm St, Uptown', phone: '987-654-3210' },
      { name: 'Goldfish Riverside', address: '789 River Rd, Riverside', phone: '555-222-1111' },
      { name: 'Goldfish Mall Branch', address: '321 Mall St, Center', phone: '555-333-2222' },
      { name: 'Goldfish Airport', address: 'Airport Rd, City', phone: '555-444-3333' },
    ],
    [
      { name: 'Friends Foods City Center', address: '789 Market St, City Center', phone: '555-123-4567' },
      { name: 'Friends Foods Suburb', address: '321 Oak St, Suburb', phone: '555-987-6543' },
      { name: 'Friends Foods Highway', address: 'Highway 22, Exit 5', phone: '555-555-1111' },
      { name: 'Friends Foods Mall Branch', address: '222 Mall Blvd, Center', phone: '555-666-2222' },
      { name: 'Friends Foods Airport', address: 'Airport Rd, Town', phone: '555-777-3333' },
    ],
  ];

  // Salesmen (5 per store)
  const salesmen = [
    [
      { name: 'Ali' },
      { name: 'Ahmed' },
      { name: 'Hamza' },
      { name: 'Imran' },
      { name: 'Zeeshan' },
    ],
    [
      { name: 'Bilal' },
      { name: 'Usman' },
      { name: 'Kashif' },
      { name: 'Fahad' },
      { name: 'Tariq' },
    ],
  ];

  for (let i = 0; i < stores.length; i++) {
    // Create store with 30 products, 5 shops, and 5 salesmen
    const store = await prisma.store.create({
      data: {
        name: stores[i].name,
        passwordHash: stores[i].passwordHash,
        address: stores[i].address,
        products: { create: productPool },
        shops: { create: shops[i] },
        salesmen: { create: salesmen[i] },
      },
      include: { products: true, shops: true, salesmen: true },
    });

    console.log(`Created store: ${store.name}`);

    // Generate 50 random sales for each store
    for (let s = 0; s < 50; s++) {
      const shop = store.shops[Math.floor(Math.random() * store.shops.length)];
      const salesman = store.salesmen[Math.floor(Math.random() * store.salesmen.length)];
      const saleType = Math.random() > 0.5 ? 'CASH' : 'CREDIT';
      const discount = Math.floor(Math.random() * 100);
      const productCount = Math.floor(Math.random() * 100) + 1; // 1 to 100 items
      const selectedProducts = [...store.products]
        .sort(() => 0.5 - Math.random())
        .slice(0, productCount);

      let total = 0;
      const saleItemsData = selectedProducts.map((p) => {
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
          salesmanId: salesman.id,
          saleType,
          discount,
          total,
          saleItems: { create: saleItemsData },
        },
      });
    }

    console.log(`Created 50 random sales for store: ${store.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
