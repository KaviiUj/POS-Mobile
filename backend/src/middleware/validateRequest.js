// Request Validation Middleware
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validation rules for user signup
 */
exports.signupValidation = [
  body('userName')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('passWord')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isInt()
    .withMessage('Role must be a number')
    .custom((value) => {
      if (value !== 99 && value !== 89) {
        throw new Error('Role must be either 99 (Admin) or 89 (Staff)');
      }
      return true;
    }),
];

/**
 * Middleware to check validation results
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    logger.warn('Validation failed', {
      errors: errorMessages,
      body: { ...req.body, passWord: '***HIDDEN***' },
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
 * Validation rules for user login
 */
exports.loginValidation = [
  body('userName')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),

  body('passWord')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation for userId parameter
 */
exports.userIdValidation = [
  body('userId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('User ID cannot be empty'),
];

/**
 * Validation rules for adding category
 */
exports.addCategoryValidation = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, & and hyphens'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be a number between 0 and 100'),
];

/**
 * Validation rules for updating category
 */
exports.updateCategoryValidation = [
  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, & and hyphens'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be a number between 0 and 100'),
];

/**
 * Validation rules for updating category status
 */
exports.updateCategoryStatusValidation = [
  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean (true or false)'),
];

/**
 * Validation rules for adding item
 */
exports.addItemValidation = [
  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('itemName')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),

  body('itemDescription')
    .trim()
    .notEmpty()
    .withMessage('Item description is required')
    .isLength({ max: 1000 })
    .withMessage('Item description cannot exceed 1000 characters'),

  body('itemImage')
    .trim()
    .notEmpty()
    .withMessage('Item image is required'),

  body('isVeg')
    .notEmpty()
    .withMessage('Veg/Non-veg status is required')
    .isBoolean()
    .withMessage('Veg status must be a boolean (true or false)'),

  body('cuisine')
    .trim()
    .custom((value, { req }) => {
      const categoryName = req.body.categoryName?.toLowerCase();
      const isDrinkCategory = categoryName === 'drinks' || categoryName === 'beverages';
      
      // If not a drink category, cuisine is required
      if (!isDrinkCategory && (!value || value.trim() === '')) {
        throw new Error('Cuisine is required for non-drink categories');
      }
      
      return true;
    })
    .isLength({ max: 100 })
    .withMessage('Cuisine cannot exceed 100 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be a number between 0 and 100'),

  body('modifiers')
    .optional()
    .isArray()
    .withMessage('Modifiers must be an array'),

  body('modifiers.*.modifierName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Modifier name is required'),

  body('modifiers.*.modifierPrice')
    .optional()
    .isNumeric()
    .withMessage('Modifier price must be a number'),
];

/**
 * Validation rules for updating item
 */
exports.updateItemValidation = [
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),

  body('itemName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),

  body('itemDescription')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Item description cannot exceed 1000 characters'),

  body('itemImage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item image cannot be empty'),

  body('isVeg')
    .optional()
    .isBoolean()
    .withMessage('Veg status must be a boolean (true or false)'),

  body('cuisine')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const categoryName = req.body.categoryName?.toLowerCase();
      const isDrinkCategory = categoryName === 'drinks' || categoryName === 'beverages';
      
      // If not a drink category and cuisine is provided, validate it
      if (!isDrinkCategory && value && value.length > 100) {
        throw new Error('Cuisine cannot exceed 100 characters');
      }
      
      return true;
    }),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be a number between 0 and 100'),

  body('modifiers')
    .optional()
    .isArray()
    .withMessage('Modifiers must be an array'),

  body('modifiers.*.modifierName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Modifier name is required'),

  body('modifiers.*.modifierPrice')
    .optional()
    .isNumeric()
    .withMessage('Modifier price must be a number'),
];

/**
 * Validation rules for updating item status
 */
exports.updateItemStatusValidation = [
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean (true or false)'),
];

/**
 * Validation rules for deleting item
 */
exports.deleteItemValidation = [
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
];

/**
 * Validation rules for creating staff
 */
exports.createStaffValidation = [
  body('staffName')
    .trim()
    .notEmpty()
    .withMessage('Staff name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Staff name must be between 3 and 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('role')
    .optional()
    .isInt()
    .withMessage('Role must be a number')
    .custom((value) => {
      if (value !== 89) {
        throw new Error('Role must be 89 (Staff)');
      }
      return true;
    }),

  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid mobile number (10-15 digits)'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('nic')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('NIC cannot exceed 50 characters'),

  body('profileImageUrl')
    .optional()
    .trim(),
];

/**
 * Validation rules for updating staff
 */
exports.updateStaffValidation = [
  body('staffId')
    .trim()
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid staff ID format'),

  body('staffName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Staff name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Staff name must be between 3 and 100 characters'),

  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid mobile number (10-15 digits)'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('nic')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('NIC cannot exceed 50 characters'),

  body('profileImageUrl')
    .optional()
    .trim(),
];

/**
 * Validation rules for updating staff status
 */
exports.updateStaffStatusValidation = [
  body('staffId')
    .trim()
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid staff ID format'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean (true or false)'),
];

/**
 * Validation rules for deleting staff
 */
exports.deleteStaffValidation = [
  body('staffId')
    .trim()
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid staff ID format'),
];

/**
 * Validation rules for creating table
 */
exports.createTableValidation = [
  body('tableName')
    .trim()
    .notEmpty()
    .withMessage('Table name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Table name must be between 1 and 50 characters'),

  body('pax')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Pax must be a number between 1 and 50'),

  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean (true or false)'),

  body('orderId')
    .optional()
    .custom((value) => {
      // Allow null, empty string, or valid MongoDB ObjectId
      if (value === null || value === '') {
        return true;
      }
      // Check if it's a valid MongoDB ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        throw new Error('Invalid order ID format');
      }
      return true;
    }),
];

/**
 * Validation rules for deleting table
 */
exports.deleteTableValidation = [
  body('tableId')
    .trim()
    .notEmpty()
    .withMessage('Table ID is required')
    .isMongoId()
    .withMessage('Invalid table ID format'),
];

/**
 * Validation rules for updating settings
 */
exports.updateSettingsValidation = [
  body('logo')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Logo URL cannot exceed 500 characters'),

  body('showCuisineFilter')
    .optional()
    .isBoolean()
    .withMessage('showCuisineFilter must be a boolean (true or false)'),

  body('showModifiers')
    .optional()
    .isBoolean()
    .withMessage('showModifiers must be a boolean (true or false)'),

  body('showModifiersPrice')
    .optional()
    .isBoolean()
    .withMessage('showModifiersPrice must be a boolean (true or false)'),

  body('outletName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Outlet name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Outlet name must be between 2 and 100 characters'),

  body('outletCurrency')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Currency code cannot be empty')
    .isLength({ min: 1, max: 10 })
    .withMessage('Currency code must be between 1 and 10 characters'),
];

