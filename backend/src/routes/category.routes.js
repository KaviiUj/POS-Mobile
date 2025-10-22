const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = require('../controllers/category.controller');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const { protectCustomer } = require('../middleware/customerAuth.middleware');
const {
  addCategoryValidation,
  updateCategoryValidation,
  updateCategoryStatusValidation,
  validate,
} = require('../middleware/validateRequest');

/**
 * @route   GET /api/v1/category
 * @desc    Get all categories
 * @access  Private (Customer)
 */
router.get('/', protectCustomer, getAllCategories);

/**
 * @route   GET /api/v1/category/active
 * @desc    Get all active categories
 * @access  Private (Customer)
 */
router.get('/active', protectCustomer, getActiveCategories);

/**
 * @route   GET /api/v1/category/:id
 * @desc    Get single category by ID
 * @access  Private (Customer)
 */
router.get('/:id', protectCustomer, getCategoryById);

/**
 * @route   POST /api/v1/category
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(99),
  addCategoryValidation,
  validate,
  createCategory
);

/**
 * @route   PUT /api/v1/category/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(99),
  updateCategoryValidation,
  validate,
  updateCategory
);

/**
 * @route   PATCH /api/v1/category/:id/status
 * @desc    Update category status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authorize(99),
  updateCategoryStatusValidation,
  validate,
  updateCategoryStatus
);

/**
 * @route   DELETE /api/v1/category/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize(99), deleteCategory);

module.exports = router;
