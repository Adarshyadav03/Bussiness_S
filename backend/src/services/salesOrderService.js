const prisma = require('../config/prisma');

async function convertQuotationToSalesOrder(quotationId) {
  const qId = Number(quotationId);

  const quotation = await prisma.quotation.findUnique({
    where: { id: qId },
    include: {
      items: true,
      customer: true,
      sales_order: true,
    },
  });

  if (!quotation) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  if (quotation.status !== 'ACCEPTED') {
    const error = new Error(
      `Cannot convert quotation with status '${quotation.status}'. Only ACCEPTED quotations can be converted to Sales Orders.`
    );
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  // Check if Sales Order already exists for this quotation
  const existingOrder = await prisma.salesOrder.findUnique({
    where: { quotation_id: qId },
  });

  if (existingOrder || quotation.sales_order) {
    const error = new Error('A Sales Order has already been generated for this quotation.');
    error.statusCode = 409;
    error.errorCode = 'CONFLICT';
    throw error;
  }

  const count = await prisma.salesOrder.count();
  const order_number = `SO-${String(count + 1).padStart(4, '0')}`;

  const salesOrder = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.salesOrder.create({
      data: {
        order_number,
        customer_id: quotation.customer_id,
        quotation_id: quotation.id,
        total_amount: quotation.grand_total,
        status: 'PENDING',
        items: {
          create: quotation.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_amount: item.line_amount,
          })),
        },
      },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Update enquiry status to WON
    await tx.enquiry.update({
      where: { id: quotation.enquiry_id },
      data: { status: 'WON' },
    });

    return createdOrder;
  });

  return salesOrder;
}

async function getAllSalesOrders() {
  return await prisma.salesOrder.findMany({
    include: {
      customer: true,
      quotation: true,
      items: {
        include: { product: true },
      },
      dispatches: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

async function getSalesOrderById(id) {
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      quotation: {
        include: { items: true },
      },
      items: {
        include: {
          product: {
            include: { inventory: true },
          },
        },
      },
      dispatches: {
        include: {
          items: { include: { product: true } },
        },
      },
    },
  });

  if (!salesOrder) {
    const error = new Error('Sales Order not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return salesOrder;
}

/**
 * Confirm Sales Order and Reserve Inventory (ADMIN ONLY)
 * Uses PostgreSQL row-level locking (FOR UPDATE) inside a transaction for concurrency safety.
 */
async function confirmSalesOrder(salesOrderId) {
  const sId = Number(salesOrderId);

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Fetch Sales Order
      const salesOrder = await tx.salesOrder.findUnique({
        where: { id: sId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!salesOrder) {
        const error = new Error('Sales Order not found');
        error.statusCode = 404;
        error.errorCode = 'NOT_FOUND';
        throw error;
      }

      if (salesOrder.status !== 'PENDING') {
        const error = new Error(
          `Sales Order status is '${salesOrder.status}'. Only PENDING orders can be confirmed.`
        );
        error.statusCode = 400;
        error.errorCode = 'BAD_REQUEST';
        throw error;
      }

      // 2. Lock inventory rows and check stock availability for all items
      for (const item of salesOrder.items) {
        const productId = item.product_id;

        // PostgreSQL Row Lock using FOR UPDATE
        const inventoryRows = await tx.$queryRaw`
          SELECT id, product_id, physical_quantity, reserved_quantity 
          FROM "inventory" 
          WHERE product_id = ${productId} 
          FOR UPDATE
        `;

        if (!inventoryRows || inventoryRows.length === 0) {
          const error = new Error(`Inventory not found for product ID ${productId}`);
          error.statusCode = 400;
          error.errorCode = 'INSUFFICIENT_STOCK';
          throw error;
        }

        const inv = inventoryRows[0];
        const available = inv.physical_quantity - inv.reserved_quantity;

        if (available < item.quantity) {
          const error = new Error(
            `Insufficient inventory for ${item.product.product_name} (${item.product.product_code}). Available: ${available}, Required: ${item.quantity}`
          );
          error.statusCode = 400;
          error.errorCode = 'INSUFFICIENT_STOCK';
          throw error;
        }
      }

      // 3. If all products have sufficient stock, perform reservations
      for (const item of salesOrder.items) {
        await tx.inventory.update({
          where: { product_id: item.product_id },
          data: {
            reserved_quantity: { increment: item.quantity },
          },
        });
      }

      // 4. Update Sales Order status to CONFIRMED
      const confirmedOrder = await tx.salesOrder.update({
        where: { id: sId },
        data: { status: 'CONFIRMED' },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                include: { inventory: true },
              },
            },
          },
        },
      });

      return confirmedOrder;
    },
    {
      timeout: 10000, // 10 second timeout for lock acquisition
    }
  );

  return result;
}

module.exports = {
  convertQuotationToSalesOrder,
  getAllSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
};
