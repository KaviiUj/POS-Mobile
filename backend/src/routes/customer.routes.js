const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerCustomer,
  refreshAccessToken,
  getCustomerInfo,
} = require('../controllers/customer.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validation middleware for customer registration
 */
const customerRegisterValidation = [
  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isNumeric()
    .withMessage('Mobile number must be numeric')
    .custom((value) => {
      if (value.toString().length > 9) {
        throw new Error('Mobile number must be maximum 9 digits');
      }
      return true;
    }),

  body('mobileType')
    .notEmpty()
    .withMessage('Mobile type is required')
    .isIn(['android', 'ios'])
    .withMessage('Mobile type must be either android or ios'),

  body('uniqueId')
    .notEmpty()
    .withMessage('Unique ID is required')
    .isNumeric()
    .withMessage('Unique ID must be numeric'),
];

/**
 * Validation middleware wrapper
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    logger.warn('Customer validation failed', {
      errors: errorMessages,
      body: req.body,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }

  next();
};

/**
 * @route   POST /api/v1/customer/register
 * @desc    Register/Login customer with mobile number
 * @access  Public
 */
router.post('/register', customerRegisterValidation, validate, registerCustomer);

/**
 * @route   POST /api/v1/customer/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @route   GET /api/v1/customer/me
 * @desc    Get current customer information
 * @access  Private (Customer)
 */
router.get('/me', protectCustomer, getCustomerInfo);

module.exports = router;

