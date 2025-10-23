const Customer = require('../models/Customer.model');
const RefreshToken = require('../models/RefreshToken.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const Table = require('../models/Table.model');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Generate Access Token (expires in 3 hours)
 */
const generateAccessToken = (customerId) => {
  return jwt.sign(
    { customerId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '3h' }
  );
};

/**
 * Generate Refresh Token (expires in 30 days)
 */
const generateRefreshToken = (customerId) => {
  return jwt.sign(
    { customerId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register customer (or login if exists) and start new session
 * @route   POST /api/v1/customer/register
 * @access  Public
 */
exports.registerCustomer = async (req, res) => {
  try {
    const { mobileNumber, mobileType, uniqueId, tableId, tableName } = req.body;

    logger.info('Customer registration attempt', {
      mobileNumber,
      mobileType,
      uniqueId,
      tableId,
      tableName,
    });

    // Check if customer already exists by uniqueId (device)
    let customer = await Customer.findOne({ uniqueId });
    const isNewCustomer = !customer;

    if (customer) {
      // Customer exists on this device - update mobile number and device type
      customer.mobileNumber = mobileNumber;
      customer.mobileType = mobileType;
      
      // If customer has an active session, end it first (new QR scan = new session)
      if (customer.sessionActive) {
        logger.info('Ending previous active session', {
          customerId: customer._id.toString(),
          previousTableId: customer.tableId,
          previousTableName: customer.tableName,
        });

        // Blacklist all existing tokens for this customer
        await TokenBlacklist.updateMany(
          { customerId: customer._id },
          { $set: { reason: 'new_session_started' } }
        );

        // Deactivate all existing refresh tokens
        await RefreshToken.updateMany(
          { customerId: customer._id, isActive: true },
          { $set: { isActive: false } }
        );
      }

      logger.info('Existing customer starting new session', {
        customerId: customer._id.toString(),
        mobileNumber: customer.mobileNumber,
        uniqueId: customer.uniqueId,
      });
    } else {
      // Create new customer for this device
      customer = new Customer({
        mobileNumber,
        mobileType,
        uniqueId,
      });

      logger.info('New customer registered', {
        mobileNumber: customer.mobileNumber,
        uniqueId: customer.uniqueId,
      });
    }

    // Start new session (whether new or existing customer)
    customer.startSession(tableId || null, tableName || '');
    await customer.save();

    logger.info('New session started', {
      customerId: customer._id.toString(),
      tableId: customer.tableId,
      tableName: customer.tableName,
      sessionStartedAt: customer.sessionStartedAt,
    });

    // Generate session PIN for table verification
    let sessionPin = null;
    if (tableId) {
      const table = await Table.findById(tableId);
      if (table) {
        sessionPin = table.generateSessionPin(customer._id);
        await table.save();

        logger.info('Session PIN generated for table', {
          customerId: customer._id.toString(),
          tableId: table._id.toString(),
          tableName: table.tableName,
          pinGeneratedAt: table.pinGeneratedAt,
        });
      } else {
        logger.warn('Table not found for PIN generation', {
          tableId,
          customerId: customer._id.toString(),
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(customer._id);
    const refreshToken = generateRefreshToken(customer._id);

    // Save refresh token to database
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await RefreshToken.create({
      token: refreshToken,
      customerId: customer._id,
      expiresAt: refreshTokenExpiry,
    });

    logger.info('Tokens generated successfully', {
      customerId: customer._id.toString(),
      mobileNumber: customer.mobileNumber,
    });

    res.status(200).json({
      success: true,
      message: isNewCustomer ? 'Customer registered successfully' : 'Customer logged in successfully',
      data: {
        customer: {
          id: customer._id,
          mobileNumber: customer.mobileNumber,
          uniqueId: customer.uniqueId,
          mobileType: customer.mobileType,
          orderId: customer.orderId,
          tableId: customer.tableId,
          tableName: customer.tableName,
          sessionActive: customer.sessionActive,
          sessionStartedAt: customer.sessionStartedAt,
        },
        sessionPin, // PIN for order verification (staff will display this)
        accessToken,
        refreshToken,
        expiresIn: '3h', // Access token expiry
      },
    });
  } catch (error) {
    logger.error('Customer registration error', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: 'Error registering customer',
      error: error.message,
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/customer/refresh-token
 * @access  Public
 */
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token not provided');
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      logger.warn('Invalid refresh token', {
        error: error.message,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if refresh token exists in database and is active
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      customerId: decoded.customerId,
      isActive: true,
    });

    if (!storedToken) {
      logger.warn('Refresh token not found or inactive', {
        customerId: decoded.customerId,
      });

      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or has been revoked',
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(decoded.customerId);
    if (!customer) {
      logger.warn('Customer not found for refresh token', {
        customerId: decoded.customerId,
      });

      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // If old access token is provided, blacklist it
    const oldAccessToken = req.headers.authorization?.split(' ')[1];
    if (oldAccessToken && oldAccessToken !== refreshToken) {
      try {
        const oldDecoded = jwt.decode(oldAccessToken);
        if (oldDecoded && oldDecoded.type === 'access') {
          await TokenBlacklist.create({
            token: oldAccessToken,
            customerId: customer._id,
            reason: 'refreshed',
            expiresAt: new Date(oldDecoded.exp * 1000),
          });

          logger.info('Old access token blacklisted', {
            customerId: customer._id.toString(),
          });
        }
      } catch (err) {
        // Ignore errors in blacklisting old token
        logger.debug('Could not blacklist old token', { error: err.message });
      }
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(customer._id);

    logger.info('Access token refreshed successfully', {
      customerId: customer._id.toString(),
      mobileNumber: customer.mobileNumber,
    });

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: '3h',
      },
    });
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current customer info
 * @route   GET /api/v1/customer/me
 * @access  Private (Customer)
 */
exports.getCustomerInfo = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .populate('tableId', 'tableName pax isAvailable')
      .select('-__v');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    logger.error('Error fetching customer info', {
      error: error.message,
      customerId: req.customer?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching customer information',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout customer and end session
 * @route   POST /api/v1/customer/logout
 * @access  Private (Customer)
 */
exports.logoutCustomer = async (req, res) => {
  try {
    const customerId = req.customer._id;
    const token = req.token;

    logger.info('Customer logout initiated', {
      customerId: customerId.toString(),
    });

    // End customer session
    const customer = await Customer.findById(customerId);
    if (customer) {
      // Clear table session PIN if exists
      if (customer.tableId) {
        const table = await Table.findById(customer.tableId);
        if (table) {
          table.clearSessionPin();
          await table.save();

          logger.info('Table session PIN cleared on logout', {
            customerId: customerId.toString(),
            tableId: table._id.toString(),
          });
        }
      }

      customer.endSession();
      await customer.save();

      logger.info('Customer session ended', {
        customerId: customerId.toString(),
      });
    }

    // Blacklist current access token
    if (token) {
      const decoded = req.decoded;
      await TokenBlacklist.create({
        token,
        customerId,
        reason: 'logout',
        expiresAt: new Date(decoded.exp * 1000),
      }).catch(err => {
        if (err.code !== 11000) {
          logger.debug('Error blacklisting token on logout', { error: err.message });
        }
      });
    }

    // Deactivate all refresh tokens for this customer
    await RefreshToken.updateMany(
      { customerId, isActive: true },
      { $set: { isActive: false } }
    );

    logger.info('Customer logged out successfully', {
      customerId: customerId.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
};

