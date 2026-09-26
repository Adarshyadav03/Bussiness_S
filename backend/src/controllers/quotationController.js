const quotationService = require('../services/quotationService');
const salesOrderService = require('../services/salesOrderService');

async function createQuotation(req, res, next) {
  try {
    const quotation = await quotationService.createQuotation(req.body);
    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Quotation created successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function getAllQuotations(req, res, next) {
  try {
    const quotations = await quotationService.getAllQuotations();
    res.status(200).json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    next(error);
  }
}

async function getQuotationById(req, res, next) {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
}

async function updateQuotationStatus(req, res, next) {
  try {
    const quotation = await quotationService.updateQuotationStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      data: quotation,
      message: `Quotation status updated to ${req.body.status}`,
    });
  } catch (error) {
    next(error);
  }
}

async function convertToSalesOrder(req, res, next) {
  try {
    const salesOrder = await salesOrderService.convertQuotationToSalesOrder(
      req.params.id
    );
    res.status(201).json({
      success: true,
      data: salesOrder,
      message: 'Quotation converted to Sales Order successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationStatus,
  convertToSalesOrder,
};
