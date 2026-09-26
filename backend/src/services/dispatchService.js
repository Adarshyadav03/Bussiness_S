const prisma = require('../config/prisma');

async function processDispatch(salesOrderId, { vehicle_number, driver_name }) {
  const sId = Number(salesOrderId);

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Fetch Sales Order with items
      const salesOrder = await tx.salesOrder.findUnique({
        where: { id: sId },
        include: {
          items: {
            include: { product: true },
          },
          dispatches: true,
        },
      });

      if (!salesOrder) {
        const error = new Error('Sales Order not found');
        error.statusCode = 404;
        error.errorCode = 'NOT_FOUND';
        throw error;
      }

      if (salesOrder.status !== 'CONFIRMED') {
        const error = new Error(
          `Sales Order status is '${salesOrder.status}'. Only CONFIRMED orders can be dispatched.`
        );
        error.statusCode = 400;
        error.errorCode = 'INVALID_ORDER_STATUS';
        throw error;
      }

      if (salesOrder.dispatches && salesOrder.dispatches.length > 0) {
        const error = new Error('Sales Order has already been dispatched.');
        error.statusCode = 409;
        error.errorCode = 'CONFLICT';
        throw error;
      }

      // Generate unique Dispatch Number
      const count = await tx.dispatch.count();
      const dispatch_number = `DISP-${String(count + 1).padStart(4, '0')}`;

      // 2. Lock inventory rows and validate reserved quantities
      for (const item of salesOrder.items) {
        const productId = item.product_id;

        const inventoryRows = await tx.$queryRaw`
          SELECT id, product_id, physical_quantity, reserved_quantity 
          FROM "inventory" 
          WHERE product_id = ${productId} 
          FOR UPDATE
        `;

        if (!inventoryRows || inventoryRows.length === 0) {
          const error = new Error(`Inventory not found for product ID ${productId}`);
          error.statusCode = 400;
          error.errorCode = 'BAD_REQUEST';
          throw error;
        }

        const inv = inventoryRows[0];

        if (inv.reserved_quantity < item.quantity) {
          const error = new Error(
            `Cannot dispatch quantity (${item.quantity}) greater than reserved quantity (${inv.reserved_quantity}) for product ${item.product.product_code}`
          );
          error.statusCode = 400;
          error.errorCode = 'BAD_REQUEST';
          throw error;
        }

        if (inv.physical_quantity < item.quantity) {
          const error = new Error(
            `Cannot dispatch quantity (${item.quantity}) greater than physical quantity (${inv.physical_quantity}) for product ${item.product.product_code}`
          );
          error.statusCode = 400;
          error.errorCode = 'BAD_REQUEST';
          throw error;
        }
      }

      // 3. Create Dispatch record
      const dispatch = await tx.dispatch.create({
        data: {
          dispatch_number,
          sales_order_id: sId,
          vehicle_number: vehicle_number.trim(),
          driver_name: driver_name.trim(),
          items: {
            create: salesOrder.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // 4. Update Inventory: physical_quantity -= dispatch_quantity, reserved_quantity -= dispatch_quantity
      for (const item of salesOrder.items) {
        await tx.inventory.update({
          where: { product_id: item.product_id },
          data: {
            physical_quantity: { decrement: item.quantity },
            reserved_quantity: { decrement: item.quantity },
          },
        });
      }

      // 5. Update Sales Order status to DISPATCHED
      const updatedOrder = await tx.salesOrder.update({
        where: { id: sId },
        data: { status: 'DISPATCHED' },
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

      return { dispatch, salesOrder: updatedOrder };
    },
    {
      timeout: 10000,
    }
  );

  return result;
}

module.exports = { processDispatch };
