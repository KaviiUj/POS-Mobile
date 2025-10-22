const express = require('express');
const router = express.Router();

// Import controllers
const { getOutletConfig } = require('../controllers/settings.controller');

// Import middleware
const { protectCustomer } = require('../middleware/customerAuth.middleware');

/**
 * @route   GET /api/v1/outletConfig
 * @desc    Get outlet configuration
 * @access  Private (Customer)
 */
router.get('/', protectCustomer, getOutletConfig);

module.exports = router;

