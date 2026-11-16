const express = require('express');
const router = express.Router();

const { getEnquiries, createEnquiry, getEnquiryTimeline } = require('../controllers/enquiryController');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { submitPricing } = require('../controllers/purchaseController');
const { 
  scheduleFollowup,
  verifyAndForwardToPurchase,
  createQuotation, 
  createSalesOrder, 
  inspectStock,
  dispatchOrder,
  confirmDelivery
} = require('../controllers/salesController');
const { packOrder } = require('../controllers/storeController');
const { getStats } = require('../controllers/statsController');

// Enquiries
router.get('/enquiries', getEnquiries);
router.post('/enquiries', createEnquiry);
router.get('/enquiries/:id/timeline', getEnquiryTimeline);

// Categories (Receptionist category management)
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Sales Department Endpoints
router.post('/sales/followup', scheduleFollowup);
router.post('/sales/verify-forward', verifyAndForwardToPurchase);
router.post('/sales/quotation', createQuotation);
router.post('/sales/order', createSalesOrder);
router.post('/sales/inspect-stock', inspectStock);
router.post('/sales/dispatch', dispatchOrder);
router.post('/sales/deliver', confirmDelivery);

// Purchase Department Endpoints
router.post('/purchase/pricing', submitPricing);

// Store Department Endpoints
router.post('/store/pack', packOrder);

// Dashboard Statistics
router.get('/stats', getStats);

module.exports = router;
