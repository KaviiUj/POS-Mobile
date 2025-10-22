const Item = require('../models/Item.model');
const logger = require('../utils/logger');

/**
 * @desc    Get all active items
 * @route   GET /api/v1/item
 * @access  Private (Customer)
 */
exports.getAllItems = async (req, res) => {
  try {
    const customerId = req.customer?._id.toString();

    logger.info('Fetching all active items', {
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const items = await Item.find({ isActive: true })
      .select('-createdBy -updatedBy -__v')
      .sort({ createdAt: -1 })
      .lean();

    // Rename _id to itemId
    const formattedItems = items.map(item => ({
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

    logger.info('Items fetched successfully', {
      count: formattedItems.length,
      customerId,
    });

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      data: formattedItems,
    });
  } catch (error) {
    logger.error('Error fetching items', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message,
    });
  }
};

/**
 * @desc    Get items by category ID
 * @route   GET /api/v1/item/category?categoryId=xxx
 * @access  Private (Customer)
 */
exports.getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const customerId = req.customer?._id.toString();

    if (!categoryId) {
      logger.warn('Category ID not provided', {
        customerId,
      });

      return res.status(400).json({
        success: false,
        message: 'Category ID is required',
      });
    }

    logger.info('Fetching items by category', {
      categoryId,
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const items = await Item.find({
      categoryId,
      isActive: true,
    })
      .select('-createdBy -updatedBy -__v')
      .sort({ itemName: 1 })
      .lean();

    // Rename _id to itemId
    const formattedItems = items.map(item => ({
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

    logger.info('Items by category fetched successfully', {
      categoryId,
      count: formattedItems.length,
      customerId,
    });

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      data: formattedItems,
    });
  } catch (error) {
    logger.error('Error fetching items by category', {
      categoryId: req.query.categoryId,
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching items by category',
      error: error.message,
    });
  }
};

