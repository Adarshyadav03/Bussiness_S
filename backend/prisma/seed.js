const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password_hash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {
      password_hash: salesPasswordHash,
      role: 'SALES_USER',
    },
    create: {
      name: 'Sales Representative',
      email: 'sales@example.com',
      password_hash: salesPasswordHash,
      role: 'SALES_USER',
    },
  });

  console.log(`Users seeded: ADMIN (${admin.email}), SALES_USER (${salesUser.email})`);

  // 2. Seed Industrial Products & Inventory
  const productsData = [
    {
      product_code: 'P001',
      product_name: 'Industrial Product A',
      category: 'Heavy Machinery',
      unit: 'PCS',
      base_price: 15000,
      physical_quantity: 100,
    },
    {
      product_code: 'P002',
      product_name: 'Industrial Product B',
      category: 'Valves',
      unit: 'PCS',
      base_price: 2500,
      physical_quantity: 200,
    },
    {
      product_code: 'P003',
      product_name: 'Industrial Product C',
      category: 'Fasteners',
      unit: 'BOX',
      base_price: 800,
      physical_quantity: 500,
    },
    {
      product_code: 'P004',
      product_name: 'Industrial Product D',
      category: 'Electrical',
      unit: 'PCS',
      base_price: 4500,
      physical_quantity: 150,
    },
    {
      product_code: 'P005',
      product_name: 'Industrial Product E',
      category: 'Hydraulics',
      unit: 'SET',
      base_price: 12000,
      physical_quantity: 80,
    },
    {
      product_code: 'P006',
      product_name: 'Industrial Product F',
      category: 'Bearings',
      unit: 'PCS',
      base_price: 1800,
      physical_quantity: 300,
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { product_code: item.product_code },
      update: {
        product_name: item.product_name,
        category: item.category,
        unit: item.unit,
        base_price: item.base_price,
      },
      create: {
        product_code: item.product_code,
        product_name: item.product_name,
        category: item.category,
        unit: item.unit,
        base_price: item.base_price,
      },
    });

    await prisma.inventory.upsert({
      where: { product_id: product.id },
      update: {
        physical_quantity: item.physical_quantity,
        reserved_quantity: 0,
      },
      create: {
        product_id: product.id,
        physical_quantity: item.physical_quantity,
        reserved_quantity: 0,
      },
    });
  }

  console.log('6 Industrial Products and Inventory seeded successfully.');

  // 3. Seed Sample Customer
  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      company_name: 'ABC Engineering Pvt. Ltd.',
      contact_person: 'John Doe',
      mobile: '+91 9876543210',
      email: 'contact@abcengineering.com',
      city: 'Mumbai',
    },
  });

  console.log(`Sample Customer seeded: ${customer.company_name}`);
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
