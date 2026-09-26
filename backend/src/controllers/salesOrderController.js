const salesOrderService = require('../services/salesOrderService');
const dispatchService = require('../services/dispatchService');

async function getAllSalesOrders(req, res, next) {
  try {
    const orders = await salesOrderService.getAllSalesOrders();
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

async function getSalesOrderById(req, res, next) {
  try {
    const order = await salesOrderService.getSalesOrderById(req.params.id);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function confirmSalesOrder(req, res, next) {
  try {
    const order = await salesOrderService.confirmSalesOrder(req.params.id);
    res.status(200).json({
      success: true,
      data: order,
      message: 'Sales Order confirmed and inventory reserved successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function dispatchSalesOrder(req, res, next) {
  try {
    const result = await dispatchService.processDispatch(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Sales Order dispatched successfully and inventory updated',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
  dispatchSalesOrder,
};
