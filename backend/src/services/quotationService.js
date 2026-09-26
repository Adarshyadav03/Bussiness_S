const prisma = require('../config/prisma');
const {
  calculateQuotationItem,
  calculateQuotationGrandTotal,
} = require('../utils/quotationMath');

async function createQuotation(data) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: Number(data.enquiry_id) },
    include: { customer: true },
  });

  if (!enquiry) {
    const error = new Error('Referenced enquiry not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Calculate each item line amount and grand total on the backend
  const calculatedItems = data.items.map((item) => calculateQuotationItem(item));
  const grandTotal = calculateQuotationGrandTotal(calculatedItems);

  // Generate unique Quotation Number
  const count = await prisma.quotation.count();
  const quotation_number = `QT-${String(count + 1).padStart(4, '0')}`;

  const quotation = await prisma.$transaction(async (tx) => {
    const created = await tx.quotation.create({
      data: {
        quotation_number,
        enquiry_id: enquiry.id,
        customer_id: enquiry.customer_id,
        valid_until: new Date(data.valid_until),
        status: 'DRAFT',
        grand_total: grandTotal,
        items: {
          create: calculatedItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            gst_percent: item.gst_percent,
            line_amount: item.line_amount,
          })),
        },
      },
      include: {
        customer: true,
        enquiry: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Update enquiry status to QUOTED
    await tx.enquiry.update({
      where: { id: enquiry.id },
      data: { status: 'QUOTED' },
    });

    return created;
  });

  return quotation;
}

async function getAllQuotations() {
  return await prisma.quotation.findMany({
    include: {
      customer: true,
      enquiry: true,
      items: {
        include: { product: true },
      },
      sales_order: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

async function getQuotationById(id) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      enquiry: true,
      items: {
        include: { product: true },
      },
      sales_order: true,
    },
  });

  if (!quotation) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return quotation;
}

async function updateQuotationStatus(id, newStatus) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
  });

  if (!quotation) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const currentStatus = quotation.status;

  // Validate state transitions
  const validTransitions = {
    DRAFT: ['SENT'],
    SENT: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: [], // Terminal for status changes, can only convert to Sales Order
    REJECTED: [],
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    const error = new Error(
      `Invalid quotation status transition from ${currentStatus} to ${newStatus}`
    );
    error.statusCode = 400;
    error.errorCode = 'INVALID_STATUS_TRANSITION';
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: newStatus },
      include: {
        customer: true,
        enquiry: true,
        items: { include: { product: true } },
      },
    });

    if (newStatus === 'REJECTED') {
      await tx.enquiry.update({
        where: { id: quotation.enquiry_id },
        data: { status: 'LOST' },
      });
    }

    return res;
  });

  return updated;
}

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationStatus,
};
