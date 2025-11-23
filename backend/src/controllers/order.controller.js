const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Table = require('../models/Table.model');
const Customer = require('../models/Customer.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const RefreshToken = require('../models/RefreshToken.model');
const KOT = require('../models/KOT.model');
const logger = require('../utils/logger');
const { emitOrderCreated } = require('../utils/socketService');

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

    // Format order items with proper calculations
    const orderItems = items.map(item => {
      // Frontend already sends discounted price, so use it directly
      const discountedPrice = item.price || 0;
      const discount = item.discount || 0;
      const quantity = item.quantity || 1;
      const selectedModifiers = item.modifiers || [];
      
      // Use modifierPrice from frontend, or calculate from selectedModifiers array as fallback
      const modifierPrice = item.modifierPrice || selectedModifiers.reduce((total, modifier) => {
        return total + (modifier.modifierPrice || 0);
      }, 0);
      
      // Calculate total item price (discounted price + modifiers) * quantity
      const itemTotal = (discountedPrice + modifierPrice) * quantity;
      
      // Debug logging
      logger.info('Item calculation debug', {
        itemName: item.itemName,
        discountedPrice,
        discount,
        modifierPrice,
        selectedModifiers,
        itemTotal,
        quantity
      });
      
      // Calculate original price before discount
      const actualPrice = discount > 0 
        ? discountedPrice / (1 - discount / 100)
        : discountedPrice;
      
      // Ensure actualPrice is a valid number
      const validActualPrice = isNaN(actualPrice) ? discountedPrice : actualPrice;
      
      // Debug logging
      logger.info('Item actualPrice calculation', {
        itemName: item.itemName,
        discountedPrice,
        discount,
        actualPrice,
        validActualPrice,
        quantity
      });
      
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        itemImage: item.itemImage,
        quantity: quantity,
        price: discountedPrice, // Use the discounted price from frontend
        actualPrice: validActualPrice, // Original price before discount
        discount: discount,
        selectedModifiers: selectedModifiers,
        itemTotal: itemTotal, // Correctly calculated total
      };
    });

    // Check if there's already an existing order for this table that hasn't been settled
    let order;
    const existingOrder = await Order.findOne({
      tableId: tableId,
      billIsSettle: false,
      orderStatus: 'new'
    });

    if (existingOrder) {
      // Update existing order instead of creating new one
      logger.info('Updating existing order instead of creating new one', {
        customerId: customerId.toString(),
        existingOrderId: existingOrder._id.toString(),
        existingOrderNumber: existingOrder.orderNumber,
        newItemCount: orderItems.length,
      });

      // Add new items to existing order
      existingOrder.items.push(...orderItems);
      
      // Recalculate totals for new items
      const newItemsTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const newItemsDiscount = orderItems.reduce((sum, item) => {
        const discountedPrice = item.price || 0;
        const discount = item.discount || 0;
        const quantity = item.quantity || 1;
        
        if (discount > 0) {
          // Calculate original price from discounted price
          const originalPrice = discountedPrice / (1 - discount / 100);
          const discountAmount = (originalPrice - discountedPrice) * quantity;
          return sum + discountAmount;
        }
        return sum;
      }, 0);
      
      existingOrder.subtotal += newItemsTotal;
      existingOrder.discount += newItemsDiscount;
      existingOrder.total = existingOrder.subtotal;
      existingOrder.updatedAt = new Date();
      
      await existingOrder.save();
      order = existingOrder;

      logger.info('Existing order updated with new items', {
        customerId: customerId.toString(),
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        totalItems: order.items.length,
        updatedTotal: order.total,
      });
    } else {
      // Calculate totals from orderItems
      const calculatedSubtotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const calculatedTotal = calculatedSubtotal;
      
      // Calculate discount amount from individual item discounts
      const calculatedDiscount = orderItems.reduce((sum, item) => {
        const discountedPrice = item.price || 0;
        const discount = item.discount || 0;
        const quantity = item.quantity || 1;
        const modifierPrice = item.modifierPrice || 0;
        
        if (discount > 0) {
          // Calculate original price from discounted price
          const originalPrice = discountedPrice / (1 - discount / 100);
          const discountAmount = (originalPrice - discountedPrice) * quantity;
          return sum + discountAmount;
        }
        return sum;
      }, 0);
      
      // Create new order
      order = await Order.create({
        cartId: cartId || null,
        tableId: tableId || null,
        tableName: tableName || '',
        items: orderItems,
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        tax: 0,
        total: calculatedTotal,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        orderStatus: 'new',
        customer: {
          phone: mobileNumber,
        },
        notes: note || '',
        billIsSettle: false,
      });

      logger.info('New order created', {
        customerId: customerId.toString(),
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
    }

    logger.info('Order created successfully', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });

    // Get customer information for real-time notification
    const customer = await Customer.findById(customerId);

    // Emit real-time notification to cashier system
    try {
      emitOrderCreated({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableId: order.tableId ? order.tableId.toString() : null,
        tableName: order.tableName || null,
        customerId: customerId.toString(),
        customerMobileNumber: customer ? customer.mobileNumber : mobileNumber || null,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        isUpdate: !!existingOrder, // Whether this is updating existing order
      });

      logger.info('Order created event emitted to cashier system', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableId: order.tableId ? order.tableId.toString() : null,
      });
    } catch (socketError) {
      // Don't fail the request if socket emission fails
      logger.error('Failed to emit order created event', {
        error: socketError.message,
        orderId: order._id.toString(),
      });
    }

    // Update customer with order information
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

    // Send KOT to kitchen
    try {
      const kotId = KOT.generateKOTId();
      const kotItems = orderItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        modifiers: item.selectedModifiers || [],
        price: item.price,
        totalPrice: item.itemTotal,
      }));

      // Determine KOT type based on whether this is updating an existing order
      const kotType = existingOrder ? 'ORDER_AMENDMENT' : 'NEW_ORDER';
      const amendmentReason = existingOrder ? 'Customer added more items to existing order' : null;

      const kot = await KOT.create({
        kotId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        kotType,
        tableName: order.tableName,
        items: kotItems,
        amendmentReason,
        timestamp: new Date(),
        kitchenStatus: 'PENDING',
      });

      // If this is an amendment, link to the original KOT
      if (existingOrder) {
        const parentKOT = await KOT.findOne({ 
          orderId: order._id.toString(), 
          kotType: 'NEW_ORDER' 
        }).sort({ timestamp: 1 });
        
        if (parentKOT) {
          kot.parentKotId = parentKOT.kotId;
          await kot.save();
        }
      }

      logger.info('KOT sent to kitchen', {
        customerId: customerId.toString(),
        kotId: kot.kotId,
        orderId: order._id.toString(),
        kotType,
        itemCount: kotItems.length,
      });

      // TODO: Send to kitchen system (printer/display)
      // await sendToKitchenSystem(kot);
    } catch (kotError) {
      logger.error('Error sending KOT to kitchen', {
        error: kotError.message,
        orderId: order._id.toString(),
        customerId: customerId.toString(),
      });
      // Don't fail the order if KOT fails
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
      message: existingOrder ? 'Items added to existing order successfully' : 'Order placed successfully',
      data: {
        cartId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        isUpdate: !!existingOrder,
        totalItems: order.items.length,
        updatedTotal: order.total,
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
 * @desc    Add items to existing order
 * @route   PUT /api/v1/order/add-items?orderId=xxx
 * @access  Private (Customer)
 */
exports.addItemsToOrder = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { items, sessionPin } = req.body;
    const customerId = req.customer._id;

    logger.info('Adding items to existing order', {
      customerId: customerId.toString(),
      orderId,
      itemCount: items.length,
    });

    // Validate required fields
    if (!orderId || !items || items.length === 0) {
      logger.warn('Missing required fields for order update', {
        customerId: customerId.toString(),
        orderId,
        itemsProvided: !!items,
      });

      return res.status(400).json({
        success: false,
        message: 'Order ID and items are required',
      });
    }

    // Find the existing order
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn('Order not found for update', {
        customerId: customerId.toString(),
        orderId,
      });

      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Validate order is still editable
    if (order.billIsSettle) {
      logger.warn('Cannot modify settled order', {
        customerId: customerId.toString(),
        orderId,
        billIsSettle: order.billIsSettle,
      });

      return res.status(400).json({
        success: false,
        message: 'Cannot modify order that has been settled',
      });
    }

    // Verify session PIN if provided
    if (sessionPin && order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table && !table.verifyPin(sessionPin)) {
        logger.warn('Invalid session PIN for order update', {
          customerId: customerId.toString(),
          orderId,
        });

        return res.status(403).json({
          success: false,
          message: 'Invalid PIN. Please check the PIN and try again.',
        });
      }
    }

    // Format new items
    const newOrderItems = items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemImage: item.itemImage,
      quantity: item.quantity || 1,
      price: item.price || 0,
      discount: item.discount || 0,
      selectedModifiers: item.modifiers || [],
      itemTotal: (item.price || 0) * (item.quantity || 1),
    }));

    // Add new items to existing order
    order.items.push(...newOrderItems);
    
    // Recalculate totals
    const newItemsTotal = newOrderItems.reduce((sum, item) => sum + item.itemTotal, 0);
    order.subtotal += newItemsTotal;
    order.total += newItemsTotal;
    
    // Update timestamp
    order.updatedAt = new Date();
    
    await order.save();

    logger.info('Order updated with new items', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      newItemCount: newOrderItems.length,
      newItemsTotal,
      updatedTotal: order.total,
    });

    // Send amendment KOT to kitchen
    try {
      const kotId = KOT.generateKOTId();
      const kotItems = newOrderItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        modifiers: item.selectedModifiers || [],
        price: item.price,
        totalPrice: item.itemTotal,
      }));

      const kot = await KOT.create({
        kotId,
        parentKotId: null, // Will be set by finding the original KOT
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        kotType: 'ORDER_AMENDMENT',
        tableName: order.tableName,
        items: kotItems,
        amendmentReason: 'Customer requested additional items',
        timestamp: new Date(),
        kitchenStatus: 'PENDING',
      });

      // Find and link to parent KOT
      const parentKOT = await KOT.findOne({ 
        orderId: order._id.toString(), 
        kotType: 'NEW_ORDER' 
      }).sort({ timestamp: 1 });
      
      if (parentKOT) {
        kot.parentKotId = parentKOT.kotId;
        await kot.save();
      }

      logger.info('Amendment KOT sent to kitchen', {
        customerId: customerId.toString(),
        kotId: kot.kotId,
        orderId: order._id.toString(),
        itemCount: kotItems.length,
      });

      // TODO: Send to kitchen system (printer/display)
      // await sendToKitchenSystem(kot);
    } catch (kotError) {
      logger.error('Error sending amendment KOT to kitchen', {
        error: kotError.message,
        orderId: order._id.toString(),
        customerId: customerId.toString(),
      });
      // Don't fail the order update if KOT fails
    }

    res.status(200).json({
      success: true,
      message: 'Items added to order successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newItemCount: newOrderItems.length,
        updatedTotal: order.total,
        items: order.items,
      },
    });
  } catch (error) {
    logger.error('Error adding items to order', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      orderId: req.query.orderId,
    });

    res.status(500).json({
      success: false,
      message: 'Error adding items to order',
      error: error.message,
    });
  }
};

/**
 * @desc    Get order by orderId
 * @route   GET /api/v1/order/get?orderId=xxx
 * @access  Private (Customer)
 */
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.query;
    const customerId = req.customer._id;

    logger.info('Getting order by ID', {
      customerId: customerId.toString(),
      orderId,
    });

    // Validate orderId parameter
    if (!orderId) {
      logger.warn('Order ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Find order by orderId
    const order = await Order.findOne({ 
      _id: orderId,
      'customer.phone': req.customer.mobileNumber 
    });

    if (!order) {
      logger.warn('Order not found', {
        customerId: customerId.toString(),
        orderId,
      });

      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    logger.info('Order retrieved successfully', {
      customerId: customerId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    });

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableName: order.tableName,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        customer: order.customer,
        notes: order.notes,
        billIsSettle: order.billIsSettle,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error getting order', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      orderId: req.query.orderId,
    });

    res.status(500).json({
      success: false,
      message: 'Error getting order',
      error: error.message,
    });
  }
};

/**
 * @desc    Settle bill for all orders in session
 * @route   PATCH /api/v1/order/settle?paymentMethod=xxx&customerId=xxx or &tableId=xxx
 * @access  Private (Staff)
 */
exports.settleBill = async (req, res) => {
  try {
    const { paymentMethod, customerId: customerIdParam, tableId: tableIdParam } = req.query;
    const staffUser = req.user; // Staff user from authenticateStaff middleware

    logger.info('Staff settling bill', {
      staffUserId: staffUser.userId,
      staffUserName: staffUser.userName,
      staffRole: staffUser.role,
      customerIdParam,
      tableIdParam,
      paymentMethod,
    });

    // Validate payment method
    if (!paymentMethod) {
      logger.warn('Payment method not provided', {
        staffUserId: staffUser.userId,
      });

      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Find customer by customerId or tableId
    let customer;
    if (customerIdParam) {
      customer = await Customer.findById(customerIdParam);
      if (!customer) {
        logger.warn('Customer not found', {
          staffUserId: staffUser.userId,
          customerId: customerIdParam,
        });

        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }
    } else if (tableIdParam) {
      const table = await Table.findById(tableIdParam);
      if (!table) {
        logger.warn('Table not found', {
          staffUserId: staffUser.userId,
          tableId: tableIdParam,
        });

        return res.status(404).json({
          success: false,
          message: 'Table not found',
        });
      }

      if (!table.customerId) {
        logger.warn('No customer associated with table', {
          staffUserId: staffUser.userId,
          tableId: tableIdParam,
        });

        return res.status(400).json({
          success: false,
          message: 'No customer associated with this table',
        });
      }

      customer = await Customer.findById(table.customerId);
      if (!customer) {
        logger.warn('Customer not found for table', {
          staffUserId: staffUser.userId,
          tableId: tableIdParam,
          customerId: table.customerId,
        });

        return res.status(404).json({
          success: false,
          message: 'Customer not found for this table',
        });
      }
    } else {
      logger.warn('Customer ID or Table ID not provided', {
        staffUserId: staffUser.userId,
      });

      return res.status(400).json({
        success: false,
        message: 'Customer ID or Table ID is required',
      });
    }

    const customerId = customer._id;

    logger.info('Settling bill for customer session', {
      staffUserId: staffUser.userId,
      customerId: customerId.toString(),
      activeOrders: customer.activeOrderIds,
      paymentMethod,
    });

    // Check if customer has active orders
    if (!customer.activeOrderIds || customer.activeOrderIds.length === 0) {
      logger.warn('No active orders to settle', {
        staffUserId: staffUser.userId,
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
        staffUserId: staffUser.userId,
        customerId: customerId.toString(),
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount: order.total,
      });
    }

    logger.info('All orders in session settled', {
      staffUserId: staffUser.userId,
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
      staffUserId: staffUser.userId,
      customerId: customerId.toString(),
    });

    // Note: Customer tokens will be invalidated when they try to use them
    // We don't have the customer's token here since staff is settling

    // Deactivate all refresh tokens for this customer
    await RefreshToken.updateMany(
      { customerId, isActive: true },
      { $set: { isActive: false } }
    );

    logger.info('All tokens invalidated after bill settlement', {
      staffUserId: staffUser.userId,
      customerId: customerId.toString(),
    });

    logger.info('Bill settlement completed successfully', {
      staffUserId: staffUser.userId,
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
      staffUserId: req.user?.userId,
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
