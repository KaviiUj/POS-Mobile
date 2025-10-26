const express = require('express');
const router = express.Router();

// Import controllers
const { 
  sendKOT, 
  getKOTByOrder, 
  acknowledgeKOT, 
  completeKOT 
} = require('../controllers/kot.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');
// TODO: Add staff authentication middleware when available
// const { protectStaff } = require('../middleware/staffAuth.middleware');

/**
 * @route   POST /api/v1/kot/send
 * @desc    Send KOT to kitchen
 * @access  Private (Customer)
 */
router.post('/send', protectCustomer, sendKOT);

/**
 * @route   GET /api/v1/kot/order?orderId=xxx
 * @desc    Get KOT by order ID
 * @access  Private (Customer)
 */
router.get('/order', protectCustomer, getKOTByOrder);

/**
 * @route   PATCH /api/v1/kot/acknowledge?kotId=xxx
 * @desc    Acknowledge KOT
 * @access  Private (Staff) - TODO: Add staff protection
 */
router.patch('/acknowledge', acknowledgeKOT);

/**
 * @route   PATCH /api/v1/kot/complete?kotId=xxx
 * @desc    Complete KOT
 * @access  Private (Staff) - TODO: Add staff protection
 */
router.patch('/complete', completeKOT);

module.exports = router;
