const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSchema, customerSchema } = require('../validators');

router.use(authenticateToken);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post(
  '/',
  requireRole('SALES_USER', 'ADMIN'),
  validateSchema(customerSchema),
  customerController.createCustomer
);

module.exports = router;
