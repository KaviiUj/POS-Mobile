const express = require('express');
const router = express.Router();

// Import controllers
const { placeOrder, settleBill, verifySessionPin } = require('../controllers/order.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');

/**
 * @route   POST /api/v1/order/place
 * @desc    Place order from cart
 * @access  Private (Customer)
 */
router.post('/place', protectCustomer, placeOrder);

/**
 * @route   PATCH /api/v1/order/settle?orderId=xxx&paymentMethod=xxx
 * @desc    Settle bill for order
 * @access  Private (Customer)
 */
router.patch('/settle', protectCustomer, settleBill);

/**
 * @route   POST /api/v1/order/verify-pin
 * @desc    Verify session PIN before placing order
 * @access  Private (Customer)
 */
router.post('/verify-pin', protectCustomer, verifySessionPin);

module.exports = router;
