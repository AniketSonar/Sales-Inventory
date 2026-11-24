const express = require('express');
const router = express.Router();

const { getEnquiries, createEnquiry, getEnquiryTimeline, assignSalesperson } = require('../controllers/enquiryController');
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
const {
  getOpcByEnquiry,
  getOpcById,
  createOrSaveOpc,
  updateOpc,
  submitForApproval,
  approveOpc,
  storeVerifyStock,
  storeCompletePacking
} = require('../controllers/opcController');

// Enquiries
router.get('/enquiries', getEnquiries);
router.post('/enquiries', createEnquiry);
router.get('/enquiries/:id/timeline', getEnquiryTimeline);
router.put('/enquiries/:id/assign', assignSalesperson);

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

// Order Processing Confirmation (OPC) Endpoints
router.get('/opc/enquiry/:enquiry_id', getOpcByEnquiry);
router.get('/opc/:id', getOpcById);
router.post('/opc', createOrSaveOpc);
router.put('/opc/:id', updateOpc);
router.post('/opc/:id/submit', submitForApproval);
router.post('/opc/:id/approve', approveOpc);
router.post('/opc/:id/store-verify', storeVerifyStock);
router.post('/opc/:id/store-pack', storeCompletePacking);

// Dashboard Statistics
router.get('/stats', getStats);

module.exports = router;
