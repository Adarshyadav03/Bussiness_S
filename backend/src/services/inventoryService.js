const prisma = require('../config/prisma');

async function getAllInventory() {
  const inventoryList = await prisma.inventory.findMany({
    include: {
      product: true,
    },
    orderBy: { product: { product_code: 'asc' } },
  });

  return inventoryList.map((inv) => ({
    id: inv.id,
    product_id: inv.product_id,
    product_code: inv.product.product_code,
    product_name: inv.product.product_name,
    category: inv.product.category,
    unit: inv.product.unit,
    physical_quantity: inv.physical_quantity,
    reserved_quantity: inv.reserved_quantity,
    available_quantity: inv.physical_quantity - inv.reserved_quantity,
    status:
      inv.physical_quantity - inv.reserved_quantity > 0
        ? 'AVAILABLE'
        : 'OUT_OF_STOCK',
    updated_at: inv.updated_at,
  }));
}

async function getInventoryByProductId(productId) {
  const inv = await prisma.inventory.findUnique({
    where: { product_id: Number(productId) },
    include: { product: true },
  });

  if (!inv) {
    const error = new Error('Inventory record not found for product');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return {
    id: inv.id,
    product_id: inv.product_id,
    product_code: inv.product.product_code,
    product_name: inv.product.product_name,
    physical_quantity: inv.physical_quantity,
    reserved_quantity: inv.reserved_quantity,
    available_quantity: inv.physical_quantity - inv.reserved_quantity,
  };
}

async function updateInventoryPhysicalQuantity(productId, physicalQuantity) {
  const newQty = Number(physicalQuantity);
  if (newQty < 0) {
    const error = new Error('Physical quantity cannot be negative');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  const existing = await prisma.inventory.findUnique({
    where: { product_id: Number(productId) },
  });

  if (!existing) {
    const error = new Error('Inventory not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  if (newQty < existing.reserved_quantity) {
    const error = new Error(
      `Cannot set physical quantity (${newQty}) lower than reserved quantity (${existing.reserved_quantity})`
    );
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  const updated = await prisma.inventory.update({
    where: { product_id: Number(productId) },
    data: { physical_quantity: newQty },
    include: { product: true },
  });

  return {
    id: updated.id,
    product_id: updated.product_id,
    product_code: updated.product.product_code,
    physical_quantity: updated.physical_quantity,
    reserved_quantity: updated.reserved_quantity,
    available_quantity: updated.physical_quantity - updated.reserved_quantity,
  };
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  updateInventoryPhysicalQuantity,
};
