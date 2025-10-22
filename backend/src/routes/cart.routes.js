const express = require('express');
const router = express.Router();

// Import controllers
const { 
  addToCart, 
  updateCart, 
  getCartItems,
  updateCartOrderStatus,
  removeItemFromCart
} = require('../controllers/cart.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');

/**
 * @route   GET /api/v1/cart?cartId=xxx
 * @desc    Get cart items with full details
 * @access  Private (Customer)
 */
router.get('/', protectCustomer, getCartItems);

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart (create new cart)
 * @access  Private (Customer)
 */
router.post('/add', protectCustomer, addToCart);

/**
 * @route   PUT /api/v1/cart/update?cartId=xxx
 * @desc    Update cart - add item to existing cart
 * @access  Private (Customer)
 */
router.put('/update', protectCustomer, updateCart);

/**
 * @route   PATCH /api/v1/cart/order?cartId=xxx
 * @desc    Update cart order status (orderId and orderIsPlaced)
 * @access  Private (Customer)
 */
router.patch('/order', protectCustomer, updateCartOrderStatus);

/**
 * @route   DELETE /api/v1/cart/item?cartId=xxx&itemId=xxx
 * @desc    Remove item from cart
 * @access  Private (Customer)
 */
router.delete('/item', protectCustomer, removeItemFromCart);

module.exports = router;

