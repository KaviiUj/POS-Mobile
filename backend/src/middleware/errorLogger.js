// Error logging middleware
const logger = require('../utils/logger');

/**
 * Middleware to log errors with full details
 */
const errorLogger = (err, req, res, next) => {
  // Prepare error log object
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || 'Unknown',
    query: req.query,
    params: req.params,
    body: req.body,
    statusCode: err.statusCode || 500,
  };

  // Don't log sensitive data
  if (errorLog.body && errorLog.body.password) {
    errorLog.body = { ...errorLog.body, password: '***HIDDEN***' };
  }

  // Log the error
  logger.error('Application Error', errorLog);

  // Pass to next error handler
  next(err);
};

/**
 * Global error handler - sends error response to client
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      statusCode: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorLogger, errorHandler };

