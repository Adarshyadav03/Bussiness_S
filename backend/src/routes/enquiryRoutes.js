const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSchema, enquirySchema } = require('../validators');

router.use(authenticateToken);

router.get('/', enquiryController.getAllEnquiries);
router.get('/:id', enquiryController.getEnquiryById);
router.post(
  '/',
  requireRole('SALES_USER'),
  validateSchema(enquirySchema),
  enquiryController.createEnquiry
);

module.exports = router;
