const enquiryService = require('../services/enquiryService');

async function createEnquiry(req, res, next) {
  try {
    const enquiry = await enquiryService.createEnquiry(req.body);
    res.status(201).json({
      success: true,
      data: enquiry,
      message: 'Enquiry created successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function getAllEnquiries(req, res, next) {
  try {
    const enquiries = await enquiryService.getAllEnquiries();
    res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
}

async function getEnquiryById(req, res, next) {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);
    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
};
