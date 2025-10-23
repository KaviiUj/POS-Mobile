const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Table = require('../models/Table.model');
const Customer = require('../models/Customer.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const RefreshToken = require('../models/RefreshToken.model');
const logger = require('../utils/logger');

/**
 * @desc    Place order from cart
 * @route   POST /api/v1/order/place
 * @access  Private (Customer)
 */
exports.placeOrder = async (req, res) => {
  try {
    const {
      cartId,
      items,
      totalItems,
      totalAmount,
      discountAmount,
      tableId,
      tableName,
      mobileNumber,
      note,
      sessionPin, // PIN provided by staff
    } = req.body;

    const customerId = req.customer._id;

    logger.info('Placing order', {
      customerId: customerId.toString(),
      cartId,
      mobileNumber,
      totalItems,
      totalAmount,
      tableId,
      tableName,
      sessionPinProvided: !!sessionPin,
    });

    // Validate required fields
    if (!items || items.length === 0) {
      logger.warn('No items provided for order', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Items are required to place order',
      });
    }

    // Validate session PIN
    if (!sessionPin) {
      logger.warn('Session PIN not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Session PIN is required to place order. Please ask staff for the PIN.',
        requiresPin: true,
      });
    }

    // Verify PIN with table
    if (tableId) {
      const table = await Table.findById(tableId);
      
      if (!table) {
        logger.warn('Table not found for PIN verification', {
          customerId: customerId.toString(),
          tableId,
        });

        return res.status(404).json({
          success: false,
          message: 'Table not found',
        });
      }

      // Verify PIN matches
      const isPinValid = table.verifyPin(sessionPin);
      
      if (!isPinValid) {
        logger.warn('Invalid session PIN provided', {
          customerId: customerId.toString(),
          tableId: table._id.toString(),
          tableName: table.tableName,
        });

        return res.status(403).json({
          success: false,
          message: 'Invalid PIN. Please check the PIN provided by staff and try again.',
          invalidPin: true,
        });
      }

      // Verify PIN belongs to this customer
      if (table.customerId && table.customerId.toString() !== customerId.toString()) {
        logger.warn('PIN does not belong to this customer', {
          customerId: customerId.toString(),
          tableCustomerId: table.customerId.toString(),
          tableId: table._id.toString(),
        });

        return res.status(403).json({
          success: false,
          message: 'This PIN is not valid for your session.',
          invalidPin: true,
        });
      }

      logger.info('Session PIN validated successfully', {
        customerId: customerId.toString(),
        tableId: table._id.toString(),
        tableName: table.tableName,
      });
    }

    // Format order items
    const orderItems = items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemImage: item.itemImage,
      quantity: 1, // Since we don't track quantity
      price: item.price || 0,
      discount: item.discount || 0,
      selectedModifiers: item.modifiers || [],
      itemTotal: item.price || 0,
    }));

    // Create order
    const order = await Order.create({
      cartId: cartId || null,
      tableId: tableId || null,
      tableName: tableName || '',
      items: orderItems,
      subtotal: totalAmount || 0,
      discount: discountAmount || 0,
      tax: 0,
      total: totalAmount - (discountAmount || 0),
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderStatus: 'new',
      customer: {
        phone: mobileNumber,
      },
      notes: note || '',
      billIsSettle: false,
    });

    logger.info('Order created successfully', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });

    // Update customer with order information
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.addOrderToSession(order.orderNumber);
      await customer.save();

      logger.info('Customer updated with order', {
        customerId: customer._id.toString(),
        orderNumber: order.orderNumber,
        activeOrders: customer.activeOrderIds.length,
      });
    }

    // Update table if tableId provided - mark as occupied on first order
    if (tableId) {
      const table = await Table.findById(tableId);
      if (table) {
        // Only mark table as occupied if it's the first order
        if (table.isAvailable) {
          table.orderId = order.orderNumber;
          table.isAvailable = false;
          await table.save();

          logger.info('Table marked as occupied', {
            tableId: table._id.toString(),
            tableName: table.tableName,
            orderId: order.orderNumber,
          });
        } else {
          logger.info('Table already occupied, added another order', {
            tableId: table._id.toString(),
            tableName: table.tableName,
            newOrderId: order.orderNumber,
            existingOrderId: table.orderId,
          });
        }
      } else {
        logger.warn('Table not found for order', {
          tableId,
          orderId: order.orderNumber,
        });
      }
    }

    // Update cart with order details
    if (cartId) {
      const cart = await Cart.findOne({
        _id: cartId,
        userId: customerId,
        orderIsPlaced: false,
      });

      if (cart) {
        cart.orderId = order.orderNumber;
        cart.orderIsPlaced = true;
        await cart.save();

        logger.info('Cart updated with order', {
          cartId: cart._id.toString(),
          orderId: order.orderNumber,
        });
      } else {
        logger.warn('Cart not found for order update', {
          cartId,
          customerId: customerId.toString(),
        });
      }
    }

    logger.info('Order placed successfully', {
      customerId: customerId.toString(),
      cartId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        cartId,
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    logger.error('Error placing order', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error placing order',
      error: error.message,
    });
  }
};

/**
 * @desc    Settle bill for all orders in session
 * @route   PATCH /api/v1/order/settle?paymentMethod=xxx
 * @access  Private (Customer)
 */
exports.settleBill = async (req, res) => {
  try {
    const { paymentMethod } = req.query;
    const customerId = req.customer._id;
    const customer = req.customer;

    logger.info('Settling bill for customer session', {
      customerId: customerId.toString(),
      activeOrders: customer.activeOrderIds,
      paymentMethod,
    });

    // Validate payment method
    if (!paymentMethod) {
      logger.warn('Payment method not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Check if customer has active orders
    if (!customer.activeOrderIds || customer.activeOrderIds.length === 0) {
      logger.warn('No active orders to settle', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'No active orders to settle',
      });
    }

    // Find all orders for this customer's session
    const orders = await Order.find({
      orderNumber: { $in: customer.activeOrderIds },
      billIsSettle: false,
    });

    if (orders.length === 0) {
      logger.warn('No unsettled orders found', {
        customerId: customerId.toString(),
        activeOrderIds: customer.activeOrderIds,
      });

      return res.status(404).json({
        success: false,
        message: 'No unsettled orders found',
      });
    }

    // Calculate total bill amount
    let totalBillAmount = 0;
    const settledOrderNumbers = [];

    // Settle all orders
    for (const order of orders) {
      order.paymentMethod = paymentMethod;
      order.paymentStatus = 'completed';
      order.billIsSettle = true;
      order.orderStatus = 'completed';
      await order.save();

      totalBillAmount += order.total;
      settledOrderNumbers.push(order.orderNumber);

      logger.info('Order settled', {
        customerId: customerId.toString(),
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount: order.total,
      });
    }

    logger.info('All orders in session settled', {
      customerId: customerId.toString(),
      settledOrders: settledOrderNumbers,
      totalAmount: totalBillAmount,
    });

    // Update table - make it available again and clear session PIN
    if (customer.tableId) {
      const table = await Table.findById(customer.tableId);
      if (table) {
        table.makeAvailable(); // This clears orderId, isAvailable, sessionPin, and customerId
        await table.save();

        logger.info('Table made available and PIN cleared after bill settlement', {
          tableId: table._id.toString(),
          tableName: table.tableName,
        });
      }
    }

    // End customer session
    customer.endSession();
    await customer.save();

    logger.info('Customer session ended after bill settlement', {
      customerId: customerId.toString(),
    });

    // Blacklist all active tokens for this customer
    const currentToken = req.token;
    if (currentToken) {
      const decoded = req.decoded;
      await TokenBlacklist.create({
        token: currentToken,
        customerId,
        reason: 'bill_settled',
        expiresAt: new Date(decoded.exp * 1000),
      }).catch(err => {
        if (err.code !== 11000) {
          logger.debug('Error blacklisting token on bill settlement', { error: err.message });
        }
      });
    }

    // Deactivate all refresh tokens for this customer
    await RefreshToken.updateMany(
      { customerId, isActive: true },
      { $set: { isActive: false } }
    );

    logger.info('All tokens invalidated after bill settlement', {
      customerId: customerId.toString(),
    });

    logger.info('Bill settlement completed successfully', {
      customerId: customerId.toString(),
      settledOrders: settledOrderNumbers.length,
      totalAmount: totalBillAmount,
    });

    res.status(200).json({
      success: true,
      message: 'Bill settled successfully. Thank you for your visit!',
      data: {
        settledOrders: settledOrderNumbers,
        totalAmount: totalBillAmount,
        orderCount: settledOrderNumbers.length,
      },
      sessionEnded: true,
      requiresNewScan: true,
    });
  } catch (error) {
    logger.error('Error settling bill', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error settling bill',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify session PIN
 * @route   POST /api/v1/order/verify-pin
 * @access  Private (Customer)
 */
exports.verifySessionPin = async (req, res) => {
  try {
    const { sessionPin, tableId } = req.body;
    const customerId = req.customer._id;

    logger.info('Verifying session PIN', {
      customerId: customerId.toString(),
      tableId,
      pinProvided: !!sessionPin,
    });

    // Validate inputs
    if (!sessionPin) {
      return res.status(400).json({
        success: false,
        message: 'Session PIN is required',
      });
    }

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required',
      });
    }

    // Find table
    const table = await Table.findById(tableId);
    
    if (!table) {
      logger.warn('Table not found for PIN verification', {
        customerId: customerId.toString(),
        tableId,
      });

      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    // Verify PIN
    const isPinValid = table.verifyPin(sessionPin);
    
    if (!isPinValid) {
      logger.warn('Invalid session PIN provided during verification', {
        customerId: customerId.toString(),
        tableId: table._id.toString(),
      });

      return res.status(403).json({
        success: false,
        message: 'Invalid PIN',
        isValid: false,
      });
    }

    // Verify PIN belongs to this customer
    if (table.customerId && table.customerId.toString() !== customerId.toString()) {
      logger.warn('PIN does not belong to this customer during verification', {
        customerId: customerId.toString(),
        tableCustomerId: table.customerId.toString(),
      });

      return res.status(403).json({
        success: false,
        message: 'This PIN is not valid for your session',
        isValid: false,
      });
    }

    logger.info('Session PIN verified successfully', {
      customerId: customerId.toString(),
      tableId: table._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'PIN verified successfully',
      isValid: true,
    });
  } catch (error) {
    logger.error('Error verifying session PIN', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error verifying PIN',
      error: error.message,
    });
  }
};
