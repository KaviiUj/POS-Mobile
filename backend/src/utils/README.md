# Backend Utils - Logger

## Winston Logger Configuration

This directory contains utility functions for the backend application. The primary utility is the **Winston Logger** for comprehensive logging throughout the application.

## 📁 Files

- `logger.js` - Main Winston logger configuration
- `logger.example.js` - Usage examples and best practices

## 🚀 Features

- **Multiple Log Levels**: error, warn, info, http, verbose, debug, silly
- **File-based Logging**: Separate files for errors, combined logs, and HTTP access
- **Console Logging**: Color-coded console output in development
- **Log Rotation**: Automatic log file rotation (5MB max, 5 files retained)
- **Morgan Integration**: HTTP request logging with Winston
- **Structured Logging**: JSON format for easy parsing and analysis

## 📂 Log Files Location

All log files are stored in: `backend/logs/`

- `error.log` - All error level logs
- `combined.log` - All logs (info and above)
- `access.log` - HTTP request logs

## 🔧 Configuration

### Environment Variables

Set the log level in your `.env` file:

```env
LOG_LEVEL=debug  # For development
# or
LOG_LEVEL=info   # For production
```

### Log Levels (in order of priority)

1. **error** (0) - Error messages
2. **warn** (1) - Warning messages
3. **info** (2) - General information
4. **http** (3) - HTTP requests
5. **verbose** (4) - Verbose information
6. **debug** (5) - Debug information
7. **silly** (6) - Very detailed information

> Setting `LOG_LEVEL=info` will log info, warn, and error messages (but not debug, verbose, or silly).

## 📝 Usage

### Basic Import

```javascript
const logger = require('./utils/logger');
```

### Logging Examples

#### Info Level
```javascript
logger.info('User logged in successfully', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});
```

#### Debug Level
```javascript
logger.debug('Processing payment', {
  orderId: order.id,
  amount: order.total,
  paymentMethod: order.paymentMethod
});
```

#### Warning Level
```javascript
logger.warn('Low stock alert', {
  productId: product.id,
  productName: product.name,
  currentStock: product.stock,
  threshold: 10
});
```

#### Error Level
```javascript
logger.error('Database query failed', {
  error: error.message,
  stack: error.stack,
  query: 'SELECT * FROM users'
});
```

#### HTTP Level (via Morgan)
```javascript
// Automatically logged by Morgan middleware
// GET /api/products 200 45ms
```

### In Express Controllers

```javascript
const logger = require('../utils/logger');

exports.createProduct = async (req, res) => {
  logger.info('Product creation initiated', {
    userId: req.user.id,
    productData: req.body
  });

  try {
    const product = await Product.create(req.body);
    
    logger.info('Product created successfully', {
      productId: product.id,
      productName: product.name,
      userId: req.user.id
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Failed to create product', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      requestBody: req.body
    });

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
```

### Error Logging with Stack Traces

```javascript
try {
  // Your code
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: 'Some context about what was happening'
  });
}
```

### Logging with Additional Context

```javascript
logger.info('Order processed', {
  orderId: order.id,
  orderNumber: order.orderNumber,
  total: order.total,
  items: order.items.length,
  customer: {
    id: customer.id,
    name: customer.name
  },
  timestamp: new Date().toISOString()
});
```

## 🔗 Morgan Integration

The logger is integrated with Morgan for HTTP request logging:

```javascript
// In server.js
const logger = require('./utils/logger');
const morgan = require('morgan');

// Development mode - detailed logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev', { stream: logger.stream }));
}

// Production mode - combined format
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
}
```

## 🎯 Best Practices

### DO:
✅ Log important application events
✅ Include relevant context in logs
✅ Use appropriate log levels
✅ Log errors with stack traces
✅ Log user actions for audit trails
✅ Use structured logging (objects)

### DON'T:
❌ Log sensitive information (passwords, tokens, credit cards)
❌ Log excessive detail in production
❌ Use console.log (use logger instead)
❌ Log in tight loops (performance impact)
❌ Forget to sanitize user input before logging

### Examples of What to Log

**Authentication:**
```javascript
logger.info('User login attempt', { email: req.body.email });
logger.info('User logged in successfully', { userId: user.id, email: user.email });
logger.warn('Failed login attempt', { email: req.body.email, reason: 'Invalid password' });
```

**Database Operations:**
```javascript
logger.debug('Database query executed', { collection: 'products', operation: 'find' });
logger.error('Database connection failed', { error: error.message });
```

**Business Logic:**
```javascript
logger.info('Order created', { orderId: order.id, total: order.total });
logger.warn('Stock below threshold', { productId, stock, threshold });
logger.error('Payment processing failed', { orderId, error: error.message });
```

**API Requests:**
```javascript
logger.http('API request', { method: req.method, url: req.url, ip: req.ip });
```

## 📊 Log Analysis

### View Real-time Logs
```bash
# All logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# HTTP requests
tail -f logs/access.log
```

### Search Logs
```bash
# Find all errors
grep "error" logs/combined.log

# Find logs for specific user
grep "userId.*12345" logs/combined.log

# Find logs from specific date
grep "2024-01-20" logs/combined.log
```

### Log File Rotation

Log files are automatically rotated when they reach 5MB. The system keeps the last 5 rotated files.

## 🔒 Security Considerations

### Never Log:
- Passwords (plain or hashed)
- API keys or tokens
- Credit card numbers
- Social security numbers
- Personal health information
- Any sensitive PII

### Example - Sanitizing Logs:
```javascript
// ❌ BAD
logger.info('User registered', { 
  email: user.email, 
  password: user.password  // Never log passwords!
});

// ✅ GOOD
logger.info('User registered', { 
  userId: user.id,
  email: user.email,
  role: user.role
});
```

## 🐛 Debugging

### Increase Log Level for Debugging
```env
LOG_LEVEL=debug
```

### Temporary Debug Logging
```javascript
if (process.env.NODE_ENV === 'development') {
  logger.debug('Detailed debug info', { 
    variable1, 
    variable2,
    stackTrace: new Error().stack 
  });
}
```

## 📦 Dependencies

- `winston` - Logging library
- `morgan` - HTTP request logger middleware

## 🆘 Troubleshooting

**Issue**: Logs not appearing in files
- **Solution**: Check if `logs/` directory exists (it's auto-created)
- Check file permissions

**Issue**: Too many log files
- **Solution**: Logs rotate automatically. Adjust `maxFiles` in `logger.js`

**Issue**: Performance issues
- **Solution**: Reduce log level in production (`LOG_LEVEL=warn` or `LOG_LEVEL=error`)

## 📚 Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Morgan Documentation](https://github.com/expressjs/morgan)
- [Best Practices for Logging](https://www.loggly.com/blog/node-js-logging-best-practices/)

