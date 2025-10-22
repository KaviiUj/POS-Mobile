const Cart = require('../models/Cart.model');
const Item = require('../models/Item.model');
const logger = require('../utils/logger');

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/add
 * @access  Private (Customer)
 */
exports.addToCart = async (req, res) => {
  try {
    const { itemId, tableId, tableName } = req.body;
    const customerId = req.customer._id;
    const mobileNumber = req.customer.mobileNumber;

    logger.info('Adding item to cart', {
      customerId: customerId.toString(),
      mobileNumber,
      itemId,
      tableId,
      tableName,
    });

    // Validate itemId
    if (!itemId) {
      logger.warn('Item ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Item ID is required',
      });
    }

    // Check if item exists and is active
    const item = await Item.findById(itemId);
    if (!item) {
      logger.warn('Item not found', {
        customerId: customerId.toString(),
        itemId,
      });

      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (!item.isActive) {
      logger.warn('Item is not active', {
        customerId: customerId.toString(),
        itemId,
      });

      return res.status(400).json({
        success: false,
        message: 'Item is not available',
      });
    }

    // Find or create cart for this customer (where order is not placed)
    let cart = await Cart.findOne({
      userId: customerId,
      orderIsPlaced: false,
    });

    if (cart) {
      // Cart exists, add item if not already present
      if (!cart.items.includes(itemId)) {
        cart.items.push(itemId);
      }
      
      // Update table info if provided
      if (tableId !== undefined) {
        cart.tableId = tableId || '';
      }
      if (tableName !== undefined) {
        cart.tableName = tableName || '';
      }
      
      await cart.save();

      logger.info('Item added to existing cart', {
        customerId: customerId.toString(),
        itemId,
        cartId: cart._id.toString(),
        tableId: cart.tableId,
        tableName: cart.tableName,
      });
    } else {
      // Create new cart
      cart = await Cart.create({
        userId: customerId,
        mobileNumber,
        items: [itemId],
        orderId: '',
        tableId: tableId || '',
        tableName: tableName || '',
        orderIsPlaced: false,
      });

      logger.info('New cart created with item', {
        customerId: customerId.toString(),
        itemId,
        cartId: cart._id.toString(),
      });
    }

    // Format response
    const response = {
      cartId: cart._id,
      userId: cart.userId,
      mobileNumber: cart.mobileNumber,
      items: cart.items,
      orderId: cart.orderId,
      tableId: cart.tableId,
      tableName: cart.tableName,
      orderIsPlaced: cart.orderIsPlaced,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: response,
    });
  } catch (error) {
    logger.error('Error adding item to cart', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message,
    });
  }
};

/**
 * @desc    Update cart - add item to existing cart
 * @route   PUT /api/v1/cart/update?cartId=xxx
 * @access  Private (Customer)
 */
exports.updateCart = async (req, res) => {
  try {
    const { cartId } = req.query;
    const { itemId } = req.body;
    const customerId = req.customer._id;

    logger.info('Updating cart', {
      customerId: customerId.toString(),
      cartId,
      itemId,
    });

    // Validate inputs
    if (!cartId) {
      logger.warn('Cart ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    if (!itemId) {
      logger.warn('Item ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Item ID is required',
      });
    }

    // Find cart
    const cart = await Cart.findOne({
      _id: cartId,
      userId: customerId,
      orderIsPlaced: false,
    });

    if (!cart) {
      logger.warn('Cart not found or already placed', {
        customerId: customerId.toString(),
        cartId,
      });

      return res.status(404).json({
        success: false,
        message: 'Cart not found or order already placed',
      });
    }

    // Check if item exists and is active
    const item = await Item.findById(itemId);
    if (!item) {
      logger.warn('Item not found for cart update', {
        customerId: customerId.toString(),
        itemId,
      });

      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (!item.isActive) {
      logger.warn('Item is not active', {
        customerId: customerId.toString(),
        itemId,
      });

      return res.status(400).json({
        success: false,
        message: 'Item is not available',
      });
    }

    // Add item to cart if not already present
    if (!cart.items.includes(itemId)) {
      cart.items.push(itemId);
      await cart.save();

      logger.info('Item added to cart via update', {
        customerId: customerId.toString(),
        itemId,
        cartId: cart._id.toString(),
        totalItems: cart.items.length,
      });
    } else {
      logger.info('Item already in cart', {
        customerId: customerId.toString(),
        itemId,
        cartId: cart._id.toString(),
      });
    }

    // Format response
    const response = {
      cartId: cart._id,
      userId: cart.userId,
      mobileNumber: cart.mobileNumber,
      items: cart.items,
      orderId: cart.orderId,
      tableId: cart.tableId,
      tableName: cart.tableName,
      orderIsPlaced: cart.orderIsPlaced,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: response,
    });
  } catch (error) {
    logger.error('Error updating cart', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      cartId: req.query.cartId,
    });

    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message,
    });
  }
};

/**
 * @desc    Get cart items with full details
 * @route   GET /api/v1/cart?cartId=xxx
 * @access  Private (Customer)
 */
exports.getCartItems = async (req, res) => {
  try {
    const { cartId } = req.query;
    const customerId = req.customer._id;

    logger.info('Fetching cart items', {
      customerId: customerId.toString(),
      cartId,
    });

    // Validate cartId
    if (!cartId) {
      logger.warn('Cart ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    // Find cart and populate items
    const cart = await Cart.findOne({
      _id: cartId,
      userId: customerId,
    })
      .populate('items')
      .lean();

    if (!cart) {
      logger.warn('Cart not found', {
        customerId: customerId.toString(),
        cartId,
      });

      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Check if order is already placed
    if (cart.orderIsPlaced === true && cart.orderId !== '') {
      logger.warn('Cart order already placed', {
        customerId: customerId.toString(),
        cartId,
        orderId: cart.orderId,
      });

      return res.status(400).json({
        success: false,
        message: 'Order has already been placed for this cart',
        orderId: cart.orderId,
      });
    }

    // Format items - rename _id to itemId and remove unnecessary fields
    const formattedItems = cart.items.map(item => ({
      itemId: item._id,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemImage: item.itemImage,
      isVeg: item.isVeg,
      cuisine: item.cuisine,
      price: item.price,
      discount: item.discount,
      modifiers: item.modifiers,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    logger.info('Cart items fetched successfully', {
      customerId: customerId.toString(),
      cartId,
      itemCount: formattedItems.length,
    });

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      data: {
        cartId: cart._id,
        userId: cart.userId,
        mobileNumber: cart.mobileNumber,
        orderId: cart.orderId,
        tableId: cart.tableId,
        tableName: cart.tableName,
        orderIsPlaced: cart.orderIsPlaced,
        items: formattedItems,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching cart items', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      cartId: req.query.cartId,
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching cart items',
      error: error.message,
    });
  }
};

/**
 * @desc    Update cart order status
 * @route   PATCH /api/v1/cart/order?cartId=xxx
 * @access  Private (Customer)
 */
exports.updateCartOrderStatus = async (req, res) => {
  try {
    const { cartId } = req.query;
    const { orderId, orderIsPlaced } = req.body;
    const customerId = req.customer._id;

    logger.info('Updating cart order status', {
      customerId: customerId.toString(),
      cartId,
      orderId,
      orderIsPlaced,
    });

    // Validate cartId
    if (!cartId) {
      logger.warn('Cart ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    // Find cart
    const cart = await Cart.findOne({
      _id: cartId,
      userId: customerId,
    });

    if (!cart) {
      logger.warn('Cart not found for order status update', {
        customerId: customerId.toString(),
        cartId,
      });

      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Update order status
    if (orderId !== undefined) {
      cart.orderId = orderId;
    }
    if (orderIsPlaced !== undefined) {
      cart.orderIsPlaced = orderIsPlaced;
    }

    await cart.save();

    logger.info('Cart order status updated successfully', {
      customerId: customerId.toString(),
      cartId: cart._id.toString(),
      orderId: cart.orderId,
      orderIsPlaced: cart.orderIsPlaced,
    });

    res.status(200).json({
      success: true,
      message: 'Cart order status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating cart order status', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      cartId: req.query.cartId,
    });

    res.status(500).json({
      success: false,
      message: 'Error updating cart order status',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/item?cartId=xxx&itemId=xxx
 * @access  Private (Customer)
 */
exports.removeItemFromCart = async (req, res) => {
  try {
    const { cartId, itemId } = req.query;
    const customerId = req.customer._id;

    logger.info('Removing item from cart', {
      customerId: customerId.toString(),
      cartId,
      itemId,
    });

    // Validate inputs
    if (!cartId) {
      logger.warn('Cart ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Cart ID is required',
      });
    }

    if (!itemId) {
      logger.warn('Item ID not provided', {
        customerId: customerId.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Item ID is required',
      });
    }

    // Find cart
    const cart = await Cart.findOne({
      _id: cartId,
      userId: customerId,
      orderIsPlaced: false,
    });

    if (!cart) {
      logger.warn('Cart not found for item removal', {
        customerId: customerId.toString(),
        cartId,
      });

      return res.status(404).json({
        success: false,
        message: 'Cart not found or order already placed',
      });
    }

    // Check if item exists in cart
    const itemIndex = cart.items.findIndex(
      id => id.toString() === itemId.toString()
    );

    if (itemIndex === -1) {
      logger.warn('Item not found in cart', {
        customerId: customerId.toString(),
        cartId,
        itemId,
      });

      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Remove item from cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    logger.info('Item removed from cart successfully', {
      customerId: customerId.toString(),
      cartId,
      itemId,
      remainingItems: cart.items.length,
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    logger.error('Error removing item from cart', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
      cartId: req.query.cartId,
      itemId: req.query.itemId,
    });

    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message,
    });
  }
};


