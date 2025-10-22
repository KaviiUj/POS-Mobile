const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Table = require('../models/Table.model');
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

    // Update table if tableId provided
    if (tableId) {
      const table = await Table.findById(tableId);
      if (table) {
        table.orderId = order.orderNumber;
        table.isAvailable = false;
        await table.save();

        logger.info('Table updated with order', {
          tableId: table._id.toString(),
          tableName: table.tableName,
          orderId: order.orderNumber,
        });
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
 * @desc    Settle bill for order
 * @route   PATCH /api/v1/order/settle?orderId=xxx&paymentMethod=xxx
 * @access  Private (Customer)
 */
exports.settleBill = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.query;
    const customerId = req.customer._id;

    logger.info('Settling bill', {
      customerId: customerId.toString(),
      orderId,
      paymentMethod,
    });

    // Validate inputs
    if (!orderId) {
      logger.warn('Order ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!paymentMethod) {
      logger.warn('Payment method not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      logger.warn('Order not found for settlement', {
        customerId: customerId.toString(),
        orderId,
      });

      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if bill is already settled
    if (order.billIsSettle) {
      logger.warn('Bill already settled', {
        customerId: customerId.toString(),
        orderId,
      });

      return res.status(400).json({
        success: false,
        message: 'Bill is already settled',
      });
    }

    // Update order
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'completed';
    order.billIsSettle = true;
    await order.save();

    logger.info('Order bill settled successfully', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      paymentMethod,
    });

    // Update table - make it available again
    if (order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table) {
        table.orderId = null;
        table.isAvailable = true;
        await table.save();

        logger.info('Table made available after bill settlement', {
          tableId: table._id.toString(),
          tableName: table.tableName,
        });
      }
    }

    logger.info('Bill settled successfully', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });

    res.status(200).json({
      success: true,
      message: 'Bill settled successfully',
    });
  } catch (error) {
    logger.error('Error settling bill', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      orderId: req.query.orderId,
    });

    res.status(500).json({
      success: false,
      message: 'Error settling bill',
      error: error.message,
    });
  }
};
