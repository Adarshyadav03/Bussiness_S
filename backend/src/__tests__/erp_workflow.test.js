const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { calculateQuotationItem, calculateQuotationGrandTotal } = require('../utils/quotationMath');

let adminToken;
let salesToken;
let testCustomerId;
let testProductId1;
let testProductId2;

beforeAll(async () => {
  // Ensure database seeded / clear non-seed test records if any
  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'admin123',
  });
  adminToken = adminRes.body.token;

  const salesRes = await request(app).post('/api/auth/login').send({
    email: 'sales@example.com',
    password: 'sales123',
  });
  salesToken = salesRes.body.token;

  // Get or create test customer
  const customerRes = await request(app)
    .get('/api/customers')
    .set('Authorization', `Bearer ${salesToken}`);
  if (customerRes.body.data.length > 0) {
    testCustomerId = customerRes.body.data[0].id;
  } else {
    const newCust = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        company_name: 'Test Corp Ltd',
        contact_person: 'Jane Doe',
        mobile: '+91 9999999999',
        email: 'jane@testcorp.com',
        city: 'Delhi',
      });
    testCustomerId = newCust.body.data.id;
  }

  // Get test products
  const productRes = await request(app)
    .get('/api/products')
    .set('Authorization', `Bearer ${salesToken}`);
  testProductId1 = productRes.body.data[0].id; // P001
  testProductId2 = productRes.body.data[1].id; // P002
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ERP Business Logic & Workflow Automated Tests', () => {
  // Test 1: Quotation total calculated correctly
  test('Test 1: Quotation total calculated correctly with Quantity, Unit Price, Discount and GST', () => {
    const item1 = {
      product_id: 1,
      quantity: 10,
      unit_price: 1000,
      discount_percent: 10, // 10,000 - 1,000 = 9,000 + 18% GST (1,620) = 10,620
      gst_percent: 18,
    };
    const calculated = calculateQuotationItem(item1);
    expect(calculated.line_amount).toBe(10620);

    const total = calculateQuotationGrandTotal([calculated]);
    expect(total).toBe(10620);
  });

  // Test 2: DRAFT quotation cannot create Sales Order
  test('Test 2: DRAFT quotation cannot create Sales Order', async () => {
    // 1. Create Enquiry
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        required_date: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Test Draft Quotation conversion',
        items: [{ product_id: testProductId1, quantity: 5 }],
      });
    const enquiryId = enqRes.body.data.id;

    // 2. Create Quotation (default status: DRAFT)
    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enquiryId,
        valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: [
          {
            product_id: testProductId1,
            quantity: 5,
            unit_price: 1000,
            discount_percent: 0,
            gst_percent: 18,
          },
        ],
      });
    const draftQuotationId = quoteRes.body.data.id;
    expect(quoteRes.body.data.status).toBe('DRAFT');

    // 3. Attempt conversion to Sales Order
    const convertRes = await request(app)
      .post(`/api/quotations/${draftQuotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convertRes.status).toBe(400);
    expect(convertRes.body.success).toBe(false);
    expect(convertRes.body.message).toContain('Only ACCEPTED quotations can be converted');
  });

  // Test 3: REJECTED quotation cannot create Sales Order
  test('Test 3: REJECTED quotation cannot create Sales Order', async () => {
    // 1. Create Enquiry & Quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        required_date: new Date(Date.now() + 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: 2 }],
      });

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.data.id,
        valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: 2, unit_price: 500 }],
      });
    const qId = quoteRes.body.data.id;

    // 2. Transition DRAFT -> SENT -> REJECTED
    await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'SENT' });

    const rejectRes = await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'REJECTED' });

    expect(rejectRes.body.data.status).toBe('REJECTED');

    // 3. Attempt conversion to Sales Order
    const convertRes = await request(app)
      .post(`/api/quotations/${qId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convertRes.status).toBe(400);
    expect(convertRes.body.success).toBe(false);
  });

  // Test 4: Same quotation cannot create duplicate Sales Orders
  test('Test 4: Same quotation cannot create duplicate Sales Orders', async () => {
    // 1. Create Enquiry & Quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        required_date: new Date(Date.now() + 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: 1 }],
      });

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.data.id,
        valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: 1, unit_price: 1500 }],
      });
    const qId = quoteRes.body.data.id;

    // 2. Transition DRAFT -> SENT -> ACCEPTED
    await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'SENT' });

    await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // 3. First conversion -> Success
    const conv1 = await request(app)
      .post(`/api/quotations/${qId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(conv1.status).toBe(201);
    expect(conv1.body.success).toBe(true);

    // 4. Second conversion -> Conflict (409)
    const conv2 = await request(app)
      .post(`/api/quotations/${qId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(conv2.status).toBe(409);
    expect(conv2.body.success).toBe(false);
  });

  // Test 5: Cannot reserve more than available inventory
  test('Test 5: Cannot reserve more than available inventory', async () => {
    // Get current inventory of product 1
    const invRes = await request(app)
      .get(`/api/inventory/${testProductId1}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const available = invRes.body.data.available_quantity;
    const excessiveQty = available + 500; // Intentionally higher than available stock

    // 1. Create Enquiry & ACCEPTED Quotation for excessive quantity
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        required_date: new Date(Date.now() + 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: excessiveQty }],
      });

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.data.id,
        valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: [{ product_id: testProductId1, quantity: excessiveQty, unit_price: 100 }],
      });
    const qId = quoteRes.body.data.id;

    await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'SENT' });
    await request(app)
      .patch(`/api/quotations/${qId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // Convert to order
    const orderRes = await request(app)
      .post(`/api/quotations/${qId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    const orderId = orderRes.body.data.id;

    // Admin tries to confirm order -> Should fail with 400 Insufficient Stock
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.success).toBe(false);
    expect(confirmRes.body.error).toBe('INSUFFICIENT_STOCK');
  });

  // Test 6: Unauthorized user role restrictions (RBAC)
  test('Test 6: RBAC checks - ADMIN blocked from quotation mutations and SALES_USER blocked from order confirmation/dispatch', async () => {
    // 1. Unauthenticated request -> 401
    const unauthRes = await request(app).get('/api/sales-orders');
    expect(unauthRes.status).toBe(401);

    // 2. ADMIN attempting SALES_USER-only operation (Create Enquiry) -> 403 Forbidden
    const adminCreateEnquiry = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: testCustomerId,
        required_date: new Date().toISOString(),
        items: [{ product_id: testProductId1, quantity: 1 }],
      });
    expect(adminCreateEnquiry.status).toBe(403);

    // 3. ADMIN attempting SALES_USER-only operation (Create Quotation) -> 403 Forbidden
    const adminCreateQuote = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enquiry_id: 1,
        valid_until: new Date().toISOString(),
        items: [{ product_id: testProductId1, quantity: 1, unit_price: 100 }],
      });
    expect(adminCreateQuote.status).toBe(403);

    // 3. ADMIN allowed operation (Update Quotation Status) -> Allowed (not 403)
    const adminUpdateStatus = await request(app)
      .patch('/api/quotations/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SENT' });
    expect(adminUpdateStatus.status).not.toBe(403);

    // 4. ADMIN attempting SALES_USER-only operation (Convert Quotation to Sales Order) -> 403 Forbidden
    const adminConvertOrder = await request(app)
      .post('/api/quotations/1/convert')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminConvertOrder.status).toBe(403);

    // 5. SALES_USER attempting ADMIN-only operation (confirm order) -> 403 Forbidden
    const confirmForbidden = await request(app)
      .post('/api/sales-orders/1/confirm')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(confirmForbidden.status).toBe(403);

    // 6. SALES_USER attempting ADMIN-only operation (dispatch order) -> 403 Forbidden
    const dispatchForbidden = await request(app)
      .post('/api/sales-orders/1/dispatch')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ vehicle_number: 'MH-12-AB-1234', driver_name: 'John' });
    expect(dispatchForbidden.status).toBe(403);
  });

  // Test 7 (Bonus): Simultaneous inventory reservations concurrency safety
  test('Test 7 (Bonus): Simultaneous inventory reservations with database locking', async () => {
    // Set a known fixed physical inventory of 100, reserved 0 for testProductId2
    await prisma.inventory.update({
      where: { product_id: testProductId2 },
      data: { physical_quantity: 100, reserved_quantity: 0 },
    });

    // Create 2 Sales Orders of quantity 70 each for testProductId2
    // Order A setup
    const enqA = await request(app).post('/api/enquiries').set('Authorization', `Bearer ${salesToken}`).send({
      customer_id: testCustomerId,
      required_date: new Date().toISOString(),
      items: [{ product_id: testProductId2, quantity: 70 }],
    });
    const quoteA = await request(app).post('/api/quotations').set('Authorization', `Bearer ${salesToken}`).send({
      enquiry_id: enqA.body.data.id,
      valid_until: new Date().toISOString(),
      items: [{ product_id: testProductId2, quantity: 70, unit_price: 100 }],
    });
    await request(app).patch(`/api/quotations/${quoteA.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${quoteA.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'ACCEPTED' });
    const orderA = await request(app).post(`/api/quotations/${quoteA.body.data.id}/convert`).set('Authorization', `Bearer ${salesToken}`);

    // Order B setup
    const enqB = await request(app).post('/api/enquiries').set('Authorization', `Bearer ${salesToken}`).send({
      customer_id: testCustomerId,
      required_date: new Date().toISOString(),
      items: [{ product_id: testProductId2, quantity: 70 }],
    });
    const quoteB = await request(app).post('/api/quotations').set('Authorization', `Bearer ${salesToken}`).send({
      enquiry_id: enqB.body.data.id,
      valid_until: new Date().toISOString(),
      items: [{ product_id: testProductId2, quantity: 70, unit_price: 100 }],
    });
    await request(app).patch(`/api/quotations/${quoteB.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${quoteB.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'ACCEPTED' });
    const orderB = await request(app).post(`/api/quotations/${quoteB.body.data.id}/convert`).set('Authorization', `Bearer ${salesToken}`);

    // Trigger simultaneous confirmations
    const [resA, resB] = await Promise.all([
      request(app).post(`/api/sales-orders/${orderA.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`),
      request(app).post(`/api/sales-orders/${orderB.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`),
    ]);

    const statuses = [resA.status, resB.status];
    // Exactly one should be 200 (Success) and one should be 400 (Insufficient Stock)
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Verify reserved quantity in database is exactly 70
    const inv = await prisma.inventory.findUnique({ where: { product_id: testProductId2 } });
    expect(inv.reserved_quantity).toBe(70);
  });

  // Test 8: Admin complete Order Confirmation & Dispatch stock lifecycle validation
  test('Test 8: Admin order confirmation reserves stock, dispatch reduces physical & reserved stock, duplicate & invalid dispatches blocked', async () => {
    // 1. Reset inventory for testProductId1 to Physical: 200, Reserved: 0
    await prisma.inventory.update({
      where: { product_id: testProductId1 },
      data: { physical_quantity: 200, reserved_quantity: 0 },
    });

    // 2. Sales User creates Order for 30 units
    const enq = await request(app).post('/api/enquiries').set('Authorization', `Bearer ${salesToken}`).send({
      customer_id: testCustomerId,
      required_date: new Date().toISOString(),
      items: [{ product_id: testProductId1, quantity: 30 }],
    });
    const quote = await request(app).post('/api/quotations').set('Authorization', `Bearer ${salesToken}`).send({
      enquiry_id: enq.body.data.id,
      valid_until: new Date().toISOString(),
      items: [{ product_id: testProductId1, quantity: 30, unit_price: 1000 }],
    });
    await request(app).patch(`/api/quotations/${quote.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${quote.body.data.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'ACCEPTED' });
    const orderRes = await request(app).post(`/api/quotations/${quote.body.data.id}/convert`).set('Authorization', `Bearer ${salesToken}`);
    const orderId = orderRes.body.data.id;

    // 3. Attempting dispatch on PENDING order -> Should fail with 400
    const pendingDispatch = await request(app)
      .post(`/api/sales-orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_number: 'MH-12-AB-9999', driver_name: 'Driver A' });
    expect(pendingDispatch.status).toBe(400);

    // 4. Admin Confirms Order -> Physical remains 200, Reserved becomes 30
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmRes.status).toBe(200);

    const invAfterConfirm = await prisma.inventory.findUnique({ where: { product_id: testProductId1 } });
    expect(invAfterConfirm.physical_quantity).toBe(200); // Physical NOT decreased!
    expect(invAfterConfirm.reserved_quantity).toBe(30);   // Reserved increased!

    // 5. Admin Processes Dispatch -> Physical becomes 170 (200-30), Reserved becomes 0 (30-30)
    const dispatchRes = await request(app)
      .post(`/api/sales-orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_number: 'MH-12-AB-9999', driver_name: 'Driver A' });
    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.data.salesOrder.status).toBe('DISPATCHED');

    const invAfterDispatch = await prisma.inventory.findUnique({ where: { product_id: testProductId1 } });
    expect(invAfterDispatch.physical_quantity).toBe(170); // Physical decreased!
    expect(invAfterDispatch.reserved_quantity).toBe(0);    // Reserved decreased!

    // 6. Duplicate dispatch on already DISPATCHED order -> Should fail with 400/409
    const duplicateDispatch = await request(app)
      .post(`/api/sales-orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_number: 'MH-12-AB-9999', driver_name: 'Driver A' });
    expect(duplicateDispatch.status).toBeGreaterThanOrEqual(400);
  });

  // Test 9: User signup defaults to SALES_USER role and blocks duplicate email registration
  test('Test 9: User signup defaults to SALES_USER role and blocks duplicate email registration', async () => {
    const newEmail = `testuser_${Date.now()}@example.com`;
    
    // 1. Signup new user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'New Test Sales User',
        email: newEmail,
        password: 'password123',
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.user.role).toBe('SALES_USER');

    // 2. Duplicate email signup -> 400
    const duplicateSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Duplicate Test User',
        email: newEmail,
        password: 'password123',
      });

    expect(duplicateSignup.status).toBe(400);
    expect(duplicateSignup.body.success).toBe(false);
  });
});
