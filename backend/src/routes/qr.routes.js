const express = require('express');
const router = express.Router();
const { encryptTableData } = require('../controllers/qr.controller');
const { body, validationResult } = require('express-validator');

/**
 * Validation middleware
 */
const encryptValidation = [
  body('tableName')
    .notEmpty()
    .withMessage('Table name is required')
    .isString()
    .withMessage('Table name must be a string'),

  body('tableId')
    .notEmpty()
    .withMessage('Table ID is required')
    .isString()
    .withMessage('Table ID must be a string'),
];

/**
 * Validation error handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

/**
 * @route   POST /api/v1/qr/encrypt
 * @desc    Encrypt table name and table ID
 * @access  Public
 */
router.post('/encrypt', encryptValidation, validate, encryptTableData);

module.exports = router;

