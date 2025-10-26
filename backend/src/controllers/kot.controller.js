const KOT = require('../models/KOT.model');
const Order = require('../models/Order.model');
const logger = require('../utils/logger');

/**
 * @desc    Send KOT to kitchen
 * @route   POST /api/v1/kot/send
 * @access  Private (Customer)
 */
exports.sendKOT = async (req, res) => {
  try {
    const { orderId, kotType, items, reason } = req.body;
    const customerId = req.customer._id;

    logger.info('Sending KOT to kitchen', {
      customerId: customerId.toString(),
      orderId,
      kotType,
      itemCount: items.length,
    });

    // Validate required fields
    if (!orderId || !kotType || !items || items.length === 0) {
      logger.warn('Missing required fields for KOT', {
        customerId: customerId.toString(),
        orderId,
        kotType,
        itemsProvided: !!items,
      });

      return res.status(400).json({
        success: false,
        message: 'Order ID, KOT type, and items are required',
      });
    }

    // Validate KOT type
    if (!['NEW_ORDER', 'ORDER_AMENDMENT'].includes(kotType)) {
      logger.warn('Invalid KOT type', {
        customerId: customerId.toString(),
        kotType,
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid KOT type. Must be NEW_ORDER or ORDER_AMENDMENT',
      });
    }

    // Find the order to get order details
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn('Order not found for KOT', {
        customerId: customerId.toString(),
        orderId,
      });

      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Generate KOT ID
    const kotId = KOT.generateKOTId();
    
    // For amendments, find parent KOT
    let parentKotId = null;
    if (kotType === 'ORDER_AMENDMENT') {
      const parentKOT = await KOT.findOne({ 
        orderId: orderId, 
        kotType: 'NEW_ORDER' 
      }).sort({ timestamp: 1 });
      
      if (parentKOT) {
        parentKotId = parentKOT.kotId;
      }
    }

    // Format items for KOT
    const kotItems = items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity || 1,
      modifiers: item.modifiers || [],
      kotStatus: 'PENDING',
      price: item.price || 0,
      totalPrice: (item.price || 0) * (item.quantity || 1),
    }));

    // Create KOT
    const kot = await KOT.create({
      kotId,
      parentKotId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      kotType,
      tableName: order.tableName,
      items: kotItems,
      amendmentReason: reason || null,
      timestamp: new Date(),
      kitchenStatus: 'PENDING',
    });

    logger.info('KOT created successfully', {
      customerId: customerId.toString(),
      kotId: kot.kotId,
      orderId: order._id.toString(),
      kotType,
      itemCount: kotItems.length,
    });

    // TODO: Send to kitchen system (printer/display)
    // await sendToKitchenSystem(kot);

    res.status(200).json({
      success: true,
      message: 'KOT sent to kitchen successfully',
      data: {
        kotId: kot.kotId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        kotType,
        tableName: order.tableName,
        itemCount: kotItems.length,
        timestamp: kot.timestamp,
      },
    });
  } catch (error) {
    logger.error('Error sending KOT', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error sending KOT to kitchen',
      error: error.message,
    });
  }
};

/**
 * @desc    Get KOT by order ID
 * @route   GET /api/v1/kot/order?orderId=xxx
 * @access  Private (Customer)
 */
exports.getKOTByOrder = async (req, res) => {
  try {
    const { orderId } = req.query;
    const customerId = req.customer._id;

    logger.info('Getting KOT by order ID', {
      customerId: customerId.toString(),
      orderId,
    });

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const kots = await KOT.find({ orderId }).sort({ timestamp: 1 });

    logger.info('KOTs retrieved successfully', {
      customerId: customerId.toString(),
      orderId,
      kotCount: kots.length,
    });

    res.status(200).json({
      success: true,
      message: 'KOTs retrieved successfully',
      data: kots,
    });
  } catch (error) {
    logger.error('Error getting KOT by order', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error getting KOT',
      error: error.message,
    });
  }
};

/**
 * @desc    Acknowledge KOT
 * @route   PATCH /api/v1/kot/acknowledge?kotId=xxx
 * @access  Private (Staff)
 */
exports.acknowledgeKOT = async (req, res) => {
  try {
    const { kotId } = req.query;
    const { acknowledgedBy } = req.body;

    logger.info('Acknowledging KOT', {
      kotId,
      acknowledgedBy,
    });

    if (!kotId) {
      return res.status(400).json({
        success: false,
        message: 'KOT ID is required',
      });
    }

    const kot = await KOT.findOne({ kotId });
    if (!kot) {
      return res.status(404).json({
        success: false,
        message: 'KOT not found',
      });
    }

    kot.acknowledge(acknowledgedBy || 'Kitchen Staff');
    await kot.save();

    logger.info('KOT acknowledged successfully', {
      kotId: kot.kotId,
      acknowledgedBy: kot.acknowledgedBy,
    });

    res.status(200).json({
      success: true,
      message: 'KOT acknowledged successfully',
      data: {
        kotId: kot.kotId,
        kitchenStatus: kot.kitchenStatus,
        acknowledgedBy: kot.acknowledgedBy,
        acknowledgedAt: kot.acknowledgedAt,
      },
    });
  } catch (error) {
    logger.error('Error acknowledging KOT', {
      error: error.message,
      stack: error.stack,
      kotId: req.query.kotId,
    });

    res.status(500).json({
      success: false,
      message: 'Error acknowledging KOT',
      error: error.message,
    });
  }
};

/**
 * @desc    Complete KOT
 * @route   PATCH /api/v1/kot/complete?kotId=xxx
 * @access  Private (Staff)
 */
exports.completeKOT = async (req, res) => {
  try {
    const { kotId } = req.query;

    logger.info('Completing KOT', {
      kotId,
    });

    if (!kotId) {
      return res.status(400).json({
        success: false,
        message: 'KOT ID is required',
      });
    }

    const kot = await KOT.findOne({ kotId });
    if (!kot) {
      return res.status(404).json({
        success: false,
        message: 'KOT not found',
      });
    }

    kot.complete();
    await kot.save();

    logger.info('KOT completed successfully', {
      kotId: kot.kotId,
      completedAt: kot.completedAt,
    });

    res.status(200).json({
      success: true,
      message: 'KOT completed successfully',
      data: {
        kotId: kot.kotId,
        kitchenStatus: kot.kitchenStatus,
        completedAt: kot.completedAt,
      },
    });
  } catch (error) {
    logger.error('Error completing KOT', {
      error: error.message,
      stack: error.stack,
      kotId: req.query.kotId,
    });

    res.status(500).json({
      success: false,
      message: 'Error completing KOT',
      error: error.message,
    });
  }
};
