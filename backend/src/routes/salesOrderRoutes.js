const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSchema, dispatchSchema } = require('../validators');

router.use(authenticateToken);

router.get('/', salesOrderController.getAllSalesOrders);
router.get('/:id', salesOrderController.getSalesOrderById);
router.post(
  '/:id/confirm',
  requireRole('ADMIN'),
  salesOrderController.confirmSalesOrder
);
router.post(
  '/:id/dispatch',
  requireRole('ADMIN'),
  validateSchema(dispatchSchema),
  salesOrderController.dispatchSalesOrder
);

module.exports = router;
