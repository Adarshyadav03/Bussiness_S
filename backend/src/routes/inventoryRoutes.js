const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSchema, updateInventorySchema } = require('../validators');

router.use(authenticateToken);

router.get('/', inventoryController.getAllInventory);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.patch(
  '/:productId',
  requireRole('ADMIN'),
  validateSchema(updateInventorySchema),
  inventoryController.updateInventoryPhysicalQuantity
);

module.exports = router;
