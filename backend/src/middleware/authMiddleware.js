// Authentication Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
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
      logger.warn('Access denied: No token provided', {
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      logger.warn('Access denied: User no longer exists', {
        userId: decoded.userId,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Access denied: User account is inactive', {
        userId: user._id.toString(),
        userName: user.userName,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.',
      });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    req.decoded = decoded;

    logger.info('Authentication successful', {
      userId: user._id.toString(),
      userName: user.userName,
      role: user.role,
      url: req.originalUrl,
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Access denied: Invalid token', {
        error: error.message,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Access denied: Token expired', {
        error: error.message,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    logger.error('Authentication error', {
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

/**
 * Middleware to check if user has required role
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied: Insufficient permissions', {
        userId: req.user._id.toString(),
        userName: req.user.userName,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }

    next();
  };
};

