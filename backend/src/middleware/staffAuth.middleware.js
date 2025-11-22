// Staff Authentication Middleware
const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const logger = require('../utils/logger');

// JWT Secret Key for staff authentication
// This is the specific SECRET_KEY for validating staff tokens
// Using the same secret as the token generation system
const JWT_SECRET = process.env.STAFF_JWT_SECRET || 'cG9zQ2FoaWVyU2VjcmV0S2V5VGVjaDRnZW4=';

// Log the secret being used on module load (for debugging)
if (process.env.NODE_ENV === 'development') {
  logger.info('Staff JWT Secret initialized', {
    usingEnvSecret: !!process.env.STAFF_JWT_SECRET,
    secretLength: JWT_SECRET.length,
    secretMatch: JWT_SECRET === 'cG9zQ2FoaWVyU2VjcmV0S2V5VGVjaDRnZW4=',
  });
}

/**
 * Middleware to protect staff routes - verify JWT staff token
 * Follows the same pattern as authenticateToken middleware
 * Attaches decoded token info to req.user (userId, userName, role, userType, iat, exp)
 */
exports.authenticateStaff = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1]; // Bearer TOKEN
    }

    // Check if token exists
    if (!token) {
      logger.warn('Staff access denied: No token provided', {
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Access token is required',
      });
    }

    // Step 1: Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      logger.warn('Staff access denied: Token blacklisted', {
        ip: req.ip,
        url: req.originalUrl,
        reason: blacklistedToken.reason,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Token has been invalidated',
      });
    }

    // Step 2: Verify & Decode Token
    let decoded;
    try {
      // Log which secret is being used (first time only, or in debug mode)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Verifying staff token', {
          usingEnvSecret: !!process.env.STAFF_JWT_SECRET,
          secretLength: JWT_SECRET.length,
        });
      }
      
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Handle token expiration
      if (error.name === 'TokenExpiredError') {
        // Token expired - blacklist it
        const expiredDecoded = jwt.decode(token);
        if (expiredDecoded && expiredDecoded.userId) {
          await TokenBlacklist.create({
            token,
            userId: expiredDecoded.userId,
            reason: 'expired',
            expiresAt: new Date(expiredDecoded.exp * 1000),
          }).catch(err => {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              logger.debug('Error blacklisting expired token', { error: err.message });
            }
          });
        }

        logger.warn('Staff access denied: Token expired', {
          ip: req.ip,
          url: req.originalUrl,
        });

        return res.status(401).json({
          status: 'error',
          message: 'Token has expired',
        });
      }

      // Handle invalid token
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Staff access denied: Invalid token', {
          error: error.message,
          errorName: error.name,
          ip: req.ip,
          url: req.originalUrl,
          usingEnvSecret: !!process.env.STAFF_JWT_SECRET,
          secretLength: JWT_SECRET.length,
        });

        return res.status(401).json({
          status: 'error',
          message: 'Invalid token - signature verification failed. Please check if the token was signed with the correct secret.',
        });
      }

      // Handle other errors
      logger.warn('Staff access denied: Token verification failed', {
        error: error.message,
        errorName: error.name,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }

    // Step 3: Verify token structure - check for required fields
    if (!decoded.userId || !decoded.userName || !decoded.role || !decoded.userType) {
      logger.warn('Staff access denied: Missing required token fields', {
        hasUserId: !!decoded.userId,
        hasUserName: !!decoded.userName,
        hasRole: !!decoded.role,
        hasUserType: !!decoded.userType,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid token structure. Required fields missing.',
      });
    }

    // Verify userType is Staff
    if (decoded.userType !== 'Staff') {
      logger.warn('Staff access denied: Invalid userType', {
        userType: decoded.userType,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid token type. Staff token required.',
      });
    }

    // Step 4: Attach decoded data to request
    // Contains: userId, userName, role, userType, iat, exp
    req.user = decoded;
    req.token = token;

    logger.info('Staff authentication successful', {
      userId: decoded.userId,
      userName: decoded.userName,
      role: decoded.role,
      userType: decoded.userType,
      url: req.originalUrl,
    });

    // Step 5: Continue to next middleware/route handler
    next();
  } catch (error) {
    logger.error('Staff authentication error', {
      message: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl,
    });

    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

