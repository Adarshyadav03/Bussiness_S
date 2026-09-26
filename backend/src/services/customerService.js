const prisma = require('../config/prisma');

async function createCustomer(data) {
  const customer = await prisma.customer.create({
    data: {
      company_name: data.company_name,
      contact_person: data.contact_person,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
    },
  });
  return customer;
}

async function getAllCustomers() {
  return await prisma.customer.findMany({
    orderBy: { created_at: 'desc' },
  });
}

async function getCustomerById(id) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: {
      enquiries: true,
      quotations: true,
      sales_orders: true,
    },
  });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }
  return customer;
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
};
