const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  validateSchema,
  quotationSchema,
  quotationStatusSchema,
} = require('../validators');

router.use(authenticateToken);

router.get('/', quotationController.getAllQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post(
  '/',
  requireRole('SALES_USER'),
  validateSchema(quotationSchema),
  quotationController.createQuotation
);
router.patch(
  '/:id/status',
  requireRole('SALES_USER'),
  validateSchema(quotationStatusSchema),
  quotationController.updateQuotationStatus
);
router.post(
  '/:id/convert',
  requireRole('SALES_USER'),
  quotationController.convertToSalesOrder
);

module.exports = router;
