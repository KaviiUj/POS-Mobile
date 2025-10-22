// Morgan HTTP request logger configuration
const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom format for detailed logging (using built-in response-time)
const detailedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Morgan middleware with Winston stream
const morganLogger = morgan(detailedFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging for health check endpoints if desired
    return req.url === '/api/health' && res.statusCode === 200;
  },
});

module.exports = morganLogger;

