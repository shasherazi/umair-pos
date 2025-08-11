import prisma from '../src/prisma';

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  // Store data
  const stores = [
    { name: 'Goldfish' },
    { name: 'Friends Foods' },
  ];

  // Product data for each store
  const products = [
    [
      {
        "id": 1,
        "name": "Ballpoint Pen",
        "price": 50,
        "stock": 100
      },
      {
        "id": 2,
        "name": "Notebook",
        "price": 250,
        "stock": 50
      },
      {
        "id": 3,
        "name": "Lead Pencil",
        "price": 30,
        "stock": 200
      },
      {
        "id": 4,
        "name": "Eraser",
        "price": 15,
        "stock": 0
      },
      {
        "id": 5,
        "name": "Ruler",
        "price": 80
      }
    ],
    [
      {
        "id": 6,
        "name": "Lays (small)",
        "price": 50
      },
      {
        "id": 7,
        "name": "Kurkure (small)",
        "price": 50
      },
      {
        "id": 8,
        "name": "Slanty (small)",
        "price": 30
      },
      {
        "id": 9,
        "name": "Cocomo",
        "price": 50
      },
      {
        "id": 10,
        "name": "Nimko (small)",
        "price": 40
      }
    ],
  ];

  // Create stores and products
  for (let i = 0; i < stores.length; i++) {
    const store = await prisma.store.create({
      data: {
        id: i + 1,
        name: stores[i].name,
        products: {
          create: products[i],
        },
      },
      include: { products: true },
    });
    console.log(`Created store: ${store.name} with products:`, store.products.map(p => p.name));
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
