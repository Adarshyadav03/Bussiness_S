const prisma = require('../config/prisma');

async function createEnquiry(data) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(data.customer_id) },
  });

  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Validate products exist
  const productIds = data.items.map((i) => Number(i.product_id));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    const error = new Error('One or more invalid product IDs provided');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  // Generate unique Enquiry Number
  const count = await prisma.enquiry.count();
  const enquiry_number = `ENQ-${String(count + 1).padStart(4, '0')}`;

  const enquiry = await prisma.$transaction(async (tx) => {
    const createdEnquiry = await tx.enquiry.create({
      data: {
        enquiry_number,
        customer_id: Number(data.customer_id),
        required_date: new Date(data.required_date),
        notes: data.notes || null,
        status: 'NEW',
        items: {
          create: data.items.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    return createdEnquiry;
  });

  return enquiry;
}

async function getAllEnquiries() {
  return await prisma.enquiry.findMany({
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
      quotations: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

async function getEnquiryById(id) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
      quotations: {
        include: { items: true },
      },
    },
  });

  if (!enquiry) {
    const error = new Error('Enquiry not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return enquiry;
}

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
};
