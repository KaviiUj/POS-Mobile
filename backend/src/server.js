const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { errorLogger, errorHandler } = require('./middleware/errorLogger');
const morganLogger = require('./middleware/morganLogger');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// HTTP request logging with Winston (via Morgan)
app.use(morganLogger);

// API Routes
app.use('/api/v1/category', require('./routes/category.routes'));
app.use('/api/v1/customer', require('./routes/customer.routes'));
app.use('/api/v1/item', require('./routes/item.routes'));
app.use('/api/v1/outletConfig', require('./routes/settings.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/order', require('./routes/order.routes'));
app.use('/api/v1/qr', require('./routes/qr.routes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'POS Mobile API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error logging middleware
app.use(errorLogger);

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server is running on ${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;

