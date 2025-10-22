/**
 * Logger Usage Examples
 * 
 * This file demonstrates how to use the Winston logger in your application
 */

const logger = require('./logger');

// ===== Basic Logging Examples =====

// Info level logging (general information)
logger.info('Server started successfully');
logger.info('User logged in', { userId: '12345', email: 'user@example.com' });

// Debug level logging (detailed debugging information)
logger.debug('Processing payment', { orderId: 'ORD-123', amount: 99.99 });

// Warning level logging (warning messages)
logger.warn('Low stock alert', { productId: 'PROD-456', stock: 5 });

// Error level logging (error messages)
logger.error('Database connection failed', { error: 'Connection timeout' });

// HTTP level logging (typically used with Morgan)
logger.http('GET /api/products - 200 - 45ms');

// ===== Logging with Error Objects =====

try {
  // Some code that might throw an error
  throw new Error('Something went wrong!');
} catch (error) {
  logger.error('An error occurred', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

// ===== Logging in Controllers =====

// Example in an Express controller
const exampleController = (req, res) => {
  logger.info('Product creation requested', {
    userId: req.user?.id,
    ip: req.ip,
    body: req.body
  });

  try {
    // Your business logic here
    const product = { id: 1, name: 'Sample Product' };
    
    logger.info('Product created successfully', {
      productId: product.id,
      productName: product.name
    });

    res.status(201).json(product);
  } catch (error) {
    logger.error('Failed to create product', {
      error: error.message,
      userId: req.user?.id,
      requestBody: req.body
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Integration with Morgan (Already configured in server.js) =====

// In your server.js or app.js:
// const morgan = require('morgan');
// const logger = require('./utils/logger');
// 
// app.use(morgan('combined', { stream: logger.stream }));

// ===== Different Log Levels =====

// The logger supports different levels in order of priority:
// error: 0
// warn: 1
// info: 2
// http: 3
// verbose: 4
// debug: 5
// silly: 6

// Set log level in .env file:
// LOG_LEVEL=debug  (development)
// LOG_LEVEL=info   (production)
// LOG_LEVEL=error  (minimal logging)

module.exports = { exampleController };

