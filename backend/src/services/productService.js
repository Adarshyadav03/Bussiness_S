const prisma = require('../config/prisma');

async function getAllProducts() {
  return await prisma.product.findMany({
    include: {
      inventory: true,
    },
    orderBy: { product_code: 'asc' },
  });
}

async function createProduct(data) {
  const existing = await prisma.product.findUnique({
    where: { product_code: data.product_code },
  });

  if (existing) {
    const error = new Error(`Product code '${data.product_code}' already exists`);
    error.statusCode = 409;
    error.errorCode = 'CONFLICT';
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        product_code: data.product_code,
        product_name: data.product_name,
        category: data.category,
        unit: data.unit,
        base_price: data.base_price,
      },
    });

    const inventory = await tx.inventory.create({
      data: {
        product_id: product.id,
        physical_quantity: data.physical_quantity || 0,
        reserved_quantity: 0,
      },
    });

    return { ...product, inventory };
  });

  return result;
}

module.exports = {
  getAllProducts,
  createProduct,
};
