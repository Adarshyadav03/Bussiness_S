const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSchema, productSchema } = require('../validators');

router.use(authenticateToken);

router.get('/', productController.getAllProducts);
router.post(
  '/',
  requireRole('ADMIN'),
  validateSchema(productSchema),
  productController.createProduct
);

module.exports = router;
