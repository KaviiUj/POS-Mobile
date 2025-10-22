const Settings = require('../models/Settings.model');
const logger = require('../utils/logger');

/**
 * @desc    Get outlet configuration
 * @route   GET /api/v1/outletConfig
 * @access  Private (Customer)
 */
exports.getOutletConfig = async (req, res) => {
  try {
    const customerId = req.customer?._id.toString();

    logger.info('Fetching outlet configuration', {
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const settings = await Settings.findOne().lean();

    if (!settings) {
      logger.warn('Settings not found', {
        customerId,
      });

      return res.status(404).json({
        success: false,
        message: 'Outlet configuration not found',
      });
    }

    // Format response
    const outletConfig = {
      logo: settings.logo,
      showCuisineFilter: settings.showCuisineFilter,
      showModifiers: settings.showModifiers,
      showModifiersPrice: settings.showModifiersPrice,
      outletName: settings.outletName,
      outletCurrency: settings.outletCurrency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    logger.info('Outlet configuration fetched successfully', {
      customerId,
      outletName: settings.outletName,
    });

    res.status(200).json({
      success: true,
      data: outletConfig,
    });
  } catch (error) {
    logger.error('Error fetching outlet configuration', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching outlet configuration',
      error: error.message,
    });
  }
};

