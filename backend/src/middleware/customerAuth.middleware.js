// Customer Authentication Middleware
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const logger = require('../utils/logger');

/**
 * Middleware to protect customer routes - verify JWT access token
 */
exports.protectCustomer = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      logger.warn('Customer access denied: No token provided', {
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      logger.warn('Customer access denied: Token blacklisted', {
        ip: req.ip,
        url: req.originalUrl,
        reason: blacklistedToken.reason,
      });

      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please refresh your token.',
        requiresRefresh: true,
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Token expired - blacklist it
        const expiredDecoded = jwt.decode(token);
        if (expiredDecoded && expiredDecoded.customerId) {
          await TokenBlacklist.create({
            token,
            customerId: expiredDecoded.customerId,
            reason: 'expired',
            expiresAt: new Date(expiredDecoded.exp * 1000),
          }).catch(err => {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              logger.debug('Error blacklisting expired token', { error: err.message });
            }
          });
        }

        logger.warn('Customer access denied: Token expired', {
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh your token.',
          requiresRefresh: true,
        });
      }

      logger.warn('Customer access denied: Invalid token', {
        error: error.message,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    // Verify token type
    if (decoded.type !== 'access') {
      logger.warn('Customer access denied: Wrong token type', {
        tokenType: decoded.type,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Access token required.',
      });
    }

    // Check if customer still exists
    const customer = await Customer.findById(decoded.customerId).populate('tableId');
    if (!customer) {
      logger.warn('Customer access denied: Customer not found', {
        customerId: decoded.customerId,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // Check if customer has an active session
    if (!customer.sessionActive) {
      logger.warn('Customer access denied: No active session', {
        customerId: customer._id.toString(),
        sessionEndedAt: customer.sessionEndedAt,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Your session has ended. Please scan the QR code again.',
        sessionEnded: true,
        requiresNewScan: true,
      });
    }

    // Check if session has timed out (no order placed within 30 minutes)
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    const sessionAge = Date.now() - new Date(customer.sessionStartedAt).getTime();
    
    if (customer.activeOrderIds.length === 0 && sessionAge > SESSION_TIMEOUT) {
      logger.warn('Customer access denied: Session timed out without order', {
        customerId: customer._id.toString(),
        sessionStartedAt: customer.sessionStartedAt,
        sessionAge: sessionAge,
        ip: req.ip,
      });

      // Auto-expire the session
      customer.endSession();
      await customer.save();

      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please scan the QR code again.',
        sessionExpired: true,
        requiresNewScan: true,
      });
    }

    // Attach customer to request
    req.customer = customer;
    req.token = token;
    req.decoded = decoded;

    logger.info('Customer authentication successful', {
      customerId: customer._id.toString(),
      mobileNumber: customer.mobileNumber,
      sessionActive: customer.sessionActive,
      activeOrders: customer.activeOrderIds.length,
      url: req.originalUrl,
    });

    next();
  } catch (error) {
    logger.error('Customer authentication error', {
      message: error.message,
      stack: error.stack,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

