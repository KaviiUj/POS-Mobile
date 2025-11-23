const logger = require('./logger');

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io instance
 */
function initializeSocket(server) {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your cashier system's URL
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info('Cashier system connected via WebSocket', {
      socketId: socket.id,
      clientIp: socket.handshake.address,
    });

    // Handle cashier system authentication (optional)
    socket.on('authenticate', (data) => {
      // You can add authentication logic here if needed
      // For now, we'll accept all connections
      logger.info('Cashier system authenticated', {
        socketId: socket.id,
        authData: data,
      });
      
      socket.emit('authenticated', {
        success: true,
        message: 'Connected to POS Mobile real-time updates',
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Cashier system disconnected', {
        socketId: socket.id,
        reason,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
}

/**
 * Emit event to all connected cashier systems
 * @param {String} eventName - Event name
 * @param {Object} data - Event data
 */
function emitToCashiers(eventName, data) {
  try {
    if (!io) {
      logger.warn('Socket.io not initialized, cannot emit event', {
        eventName,
      });
      return;
    }

    io.emit(eventName, data);
    logger.info('Event emitted to cashier systems', {
      eventName,
      connectedClients: io.sockets.sockets.size,
      data: Object.keys(data),
    });
  } catch (error) {
    logger.error('Error emitting event to cashier systems', {
      eventName,
      error: error.message,
    });
  }
}

/**
 * Emit PIN generated event
 * @param {Object} pinData - PIN data
 */
function emitPinGenerated(pinData) {
  emitToCashiers('pin_generated', {
    timestamp: new Date().toISOString(),
    event: 'pin_generated',
    data: {
      tableId: pinData.tableId,
      tableName: pinData.tableName,
      sessionPin: pinData.sessionPin,
      customerId: pinData.customerId,
      customerMobileNumber: pinData.customerMobileNumber,
      pinGeneratedAt: pinData.pinGeneratedAt,
    },
  });
}

/**
 * Emit order created event
 * @param {Object} orderData - Order data
 */
function emitOrderCreated(orderData) {
  emitToCashiers('order_created', {
    timestamp: new Date().toISOString(),
    event: 'order_created',
    data: {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      tableId: orderData.tableId,
      tableName: orderData.tableName,
      customerId: orderData.customerId,
      customerMobileNumber: orderData.customerMobileNumber,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      tax: orderData.tax,
      total: orderData.total,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.orderStatus,
      createdAt: orderData.createdAt,
      isUpdate: orderData.isUpdate || false, // Whether this is updating existing order
    },
  });
}

module.exports = {
  initializeSocket,
  getIO,
  emitToCashiers,
  emitPinGenerated,
  emitOrderCreated,
};

