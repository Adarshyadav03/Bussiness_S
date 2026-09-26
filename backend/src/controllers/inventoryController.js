const inventoryService = require('../services/inventoryService');

async function getAllInventory(req, res, next) {
  try {
    const inventory = await inventoryService.getAllInventory();
    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

async function getInventoryByProductId(req, res, next) {
  try {
    const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

async function updateInventoryPhysicalQuantity(req, res, next) {
  try {
    const inventory = await inventoryService.updateInventoryPhysicalQuantity(
      req.params.productId,
      req.body.physical_quantity
    );
    res.status(200).json({
      success: true,
      data: inventory,
      message: 'Inventory physical quantity updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  updateInventoryPhysicalQuantity,
};
