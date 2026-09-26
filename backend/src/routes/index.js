const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const enquiryRoutes = require('./enquiryRoutes');
const quotationRoutes = require('./quotationRoutes');
const salesOrderRoutes = require('./salesOrderRoutes');

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/quotations', quotationRoutes);
router.use('/sales-orders', salesOrderRoutes);

module.exports = router;
