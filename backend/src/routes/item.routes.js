const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllItems,
  getItemsByCategory,
} = require('../controllers/item.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');

/**
 * @route   GET /api/v1/item
 * @desc    Get all active items
 * @access  Private (Customer)
 */
router.get('/', protectCustomer, getAllItems);

/**
 * @route   GET /api/v1/item/category?categoryId=xxx
 * @desc    Get items by category ID
 * @access  Private (Customer)
 */
router.get('/category', protectCustomer, getItemsByCategory);

module.exports = router;

