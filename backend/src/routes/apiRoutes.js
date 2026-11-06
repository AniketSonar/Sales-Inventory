const express = require('express');
const router = express.Router();

const { getEnquiries, createEnquiry } = require('../controllers/enquiryController');
const { submitPricing } = require('../controllers/purchaseController');
const { createQuotation, createSalesOrder, dispatchOrder } = require('../controllers/salesController');
const { packOrder } = require('../controllers/storeController');
const { getStats } = require('../controllers/statsController');

// All API Endpoints backed by Real Database
router.get('/enquiries', getEnquiries);
router.post('/enquiries', createEnquiry);

router.post('/purchase/pricing', submitPricing);

router.post('/sales/quotation', createQuotation);
router.post('/sales/order', createSalesOrder);
router.post('/sales/dispatch', dispatchOrder);

router.post('/store/pack', packOrder);

router.get('/stats', getStats);

module.exports = router;
