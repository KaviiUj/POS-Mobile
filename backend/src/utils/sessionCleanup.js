const Customer = require('../models/Customer.model');
const RefreshToken = require('../models/RefreshToken.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const logger = require('./logger');

/**
 * Configuration for session cleanup
 */
const CLEANUP_CONFIG = {
  // Time in milliseconds after which unused sessions (no orders) are expired
  UNUSED_SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Time in milliseconds after which old ended sessions are removed from DB
  ENDED_SESSION_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Clean up expired sessions (sessions with no orders after timeout)
 * @returns {Object} Cleanup statistics
 */
async function cleanupExpiredSessions() {
  try {
    const cutoffTime = new Date(Date.now() - CLEANUP_CONFIG.UNUSED_SESSION_TIMEOUT);

    logger.info('Starting expired sessions cleanup', {
      cutoffTime,
      timeoutMinutes: CLEANUP_CONFIG.UNUSED_SESSION_TIMEOUT / 60000,
    });

    // Find active sessions with no orders that started before cutoff time
    const expiredSessions = await Customer.find({
      sessionActive: true,
      activeOrderIds: { $size: 0 },
      sessionStartedAt: { $lt: cutoffTime },
    });

    let cleanedCount = 0;
    const cleanedCustomerIds = [];

    for (const customer of expiredSessions) {
      logger.info('Expiring unused session', {
        customerId: customer._id.toString(),
        mobileNumber: customer.mobileNumber,
        sessionStartedAt: customer.sessionStartedAt,
        sessionAge: Date.now() - new Date(customer.sessionStartedAt).getTime(),
      });

      // End the session
      customer.endSession();
      await customer.save();

      // Deactivate all refresh tokens for this customer
      await RefreshToken.updateMany(
        { customerId: customer._id, isActive: true },
        { $set: { isActive: false } }
      );

      cleanedCount++;
      cleanedCustomerIds.push(customer._id.toString());
    }

    logger.info('Expired sessions cleanup completed', {
      cleanedCount,
      customerIds: cleanedCustomerIds,
    });

    return {
      success: true,
      cleanedCount,
      customerIds: cleanedCustomerIds,
    };
  } catch (error) {
    logger.error('Error during session cleanup', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old ended sessions from database
 * @returns {Object} Cleanup statistics
 */
async function cleanupOldEndedSessions() {
  try {
    const cutoffTime = new Date(Date.now() - CLEANUP_CONFIG.ENDED_SESSION_RETENTION);

    logger.info('Starting old ended sessions cleanup', {
      cutoffTime,
      retentionDays: CLEANUP_CONFIG.ENDED_SESSION_RETENTION / (24 * 60 * 60 * 1000),
    });

    // Find customers with ended sessions older than retention period
    const result = await Customer.updateMany(
      {
        sessionActive: false,
        sessionEndedAt: { $lt: cutoffTime },
      },
      {
        $set: {
          sessionEndedAt: null,
          lastOrderId: null,
        },
      }
    );

    logger.info('Old ended sessions cleanup completed', {
      modifiedCount: result.modifiedCount,
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    logger.error('Error during old sessions cleanup', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up expired blacklisted tokens
 * @returns {Object} Cleanup statistics
 */
async function cleanupExpiredTokens() {
  try {
    logger.info('Starting expired tokens cleanup');

    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    logger.info('Expired tokens cleanup completed', {
      deletedCount: result.deletedCount,
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error('Error during token cleanup', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up expired refresh tokens
 * @returns {Object} Cleanup statistics
 */
async function cleanupExpiredRefreshTokens() {
  try {
    logger.info('Starting expired refresh tokens cleanup');

    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    logger.info('Expired refresh tokens cleanup completed', {
      deletedCount: result.deletedCount,
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error('Error during refresh token cleanup', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run all cleanup tasks
 * @returns {Object} Combined cleanup statistics
 */
async function runAllCleanupTasks() {
  logger.info('Starting all cleanup tasks');

  const results = {
    expiredSessions: await cleanupExpiredSessions(),
    oldEndedSessions: await cleanupOldEndedSessions(),
    expiredTokens: await cleanupExpiredTokens(),
    expiredRefreshTokens: await cleanupExpiredRefreshTokens(),
  };

  logger.info('All cleanup tasks completed', results);

  return results;
}

/**
 * Initialize scheduled cleanup (runs every hour)
 */
function initializeScheduledCleanup() {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  logger.info('Initializing scheduled session cleanup', {
    intervalMinutes: CLEANUP_INTERVAL / 60000,
  });

  // Run immediately on startup
  runAllCleanupTasks();

  // Then run every hour
  setInterval(() => {
    logger.info('Running scheduled cleanup tasks');
    runAllCleanupTasks();
  }, CLEANUP_INTERVAL);
}

module.exports = {
  cleanupExpiredSessions,
  cleanupOldEndedSessions,
  cleanupExpiredTokens,
  cleanupExpiredRefreshTokens,
  runAllCleanupTasks,
  initializeScheduledCleanup,
  CLEANUP_CONFIG,
};

