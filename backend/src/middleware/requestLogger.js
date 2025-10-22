// Request/Response logging middleware
const logger = require('../utils/logger');

/**
 * Middleware to log detailed request and response information
 */
const requestLogger = (req, res, next) => {
  // Log request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || 'Unknown',
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
  };

  // Don't log sensitive data like passwords
  if (requestLog.body && requestLog.body.password) {
    requestLog.body = { ...requestLog.body, password: '***HIDDEN***' };
  }

  logger.info('Incoming Request', requestLog);

  // Capture the original end function
  const originalEnd = res.end;
  const chunks = [];

  // Override res.write to capture response body
  const originalWrite = res.write;
  res.write = function (chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    originalWrite.apply(res, arguments);
  };

  // Override res.end to log response
  res.end = function (chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    const responseBody = Buffer.concat(chunks).toString('utf8');
    
    // Log response details
    const responseLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: Date.now() - req._startTime,
      contentType: res.get('content-type'),
      contentLength: res.get('content-length'),
    };

    // Only log response body for errors or if it's not too large
    if (res.statusCode >= 400 || responseBody.length < 1000) {
      try {
        responseLog.responseBody = JSON.parse(responseBody);
      } catch (e) {
        responseLog.responseBody = responseBody.substring(0, 500);
      }
    }

    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Server Error Response', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Client Error Response', responseLog);
    } else {
      logger.info('Successful Response', responseLog);
    }

    originalEnd.apply(res, arguments);
  };

  // Track request start time
  req._startTime = Date.now();

  next();
};

module.exports = requestLogger;

