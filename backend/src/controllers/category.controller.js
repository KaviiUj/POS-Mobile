const Category = require('../models/Category.model');
const logger = require('../utils/logger');

/**
 * @desc    Get all categories
 * @route   GET /api/v1/category
 * @access  Private
 */
exports.getAllCategories = async (req, res) => {
  try {
    const customerId = req.customer?._id.toString();
    
    logger.info('Fetching all categories', {
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .lean();

    // Rename _id to categoryId
    const formattedCategories = categories.map(category => ({
      categoryId: category._id,
      categoryName: category.categoryName,
      discount: category.discount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    logger.info('Categories fetched successfully', {
      count: formattedCategories.length,
      customerId,
    });

    res.status(200).json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories,
    });
  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

/**
 * @desc    Get active categories only
 * @route   GET /api/v1/category/active
 * @access  Private
 */
exports.getActiveCategories = async (req, res) => {
  try {
    const customerId = req.customer?._id.toString();
    
    logger.info('Fetching active categories', {
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const categories = await Category.find({ isActive: true })
      .sort({ categoryName: 1 })
      .lean();

    // Rename _id to categoryId
    const formattedCategories = categories.map(category => ({
      categoryId: category._id,
      categoryName: category.categoryName,
      discount: category.discount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    logger.info('Active categories fetched successfully', {
      count: formattedCategories.length,
      customerId,
    });

    res.status(200).json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories,
    });
  } catch (error) {
    logger.error('Error fetching active categories', {
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching active categories',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/v1/category/:id
 * @access  Private
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?._id.toString();

    logger.info('Fetching category by ID', {
      categoryId: id,
      customerId,
      mobileNumber: req.customer?.mobileNumber,
    });

    const category = await Category.findById(id)
      .lean();

    if (!category) {
      logger.warn('Category not found', {
        categoryId: id,
        customerId,
      });

      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Rename _id to categoryId
    const formattedCategory = {
      categoryId: category._id,
      categoryName: category.categoryName,
      discount: category.discount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    logger.info('Category fetched successfully', {
      categoryId: id,
      categoryName: category.categoryName,
      customerId,
    });

    res.status(200).json({
      success: true,
      data: formattedCategory,
    });
  } catch (error) {
    logger.error('Error fetching category by ID', {
      categoryId: req.params.id,
      error: error.message,
      stack: error.stack,
      customerId: req.customer?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/v1/category
 * @access  Private (Admin only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { categoryName, discount } = req.body;

    logger.info('Creating new category', {
      categoryName,
      discount,
      userId: req.user._id.toString(),
      userName: req.user.userName,
    });

    // Check if category already exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      logger.warn('Category already exists', {
        categoryName,
        userId: req.user._id.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    // Create category with createdBy field
    const category = await Category.create({
      categoryName,
      discount: discount || 0,
      createdBy: req.user._id,
      isActive: true,
    });

    logger.info('Category created successfully', {
      categoryId: category._id.toString(),
      categoryName: category.categoryName,
      userId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    logger.error('Error creating category', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message,
    });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/v1/category/:id
 * @access  Private (Admin only)
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, discount } = req.body;

    logger.info('Updating category', {
      categoryId: id,
      updates: { categoryName, discount },
      userId: req.user._id.toString(),
      userName: req.user.userName,
    });

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      logger.warn('Category not found for update', {
        categoryId: id,
        userId: req.user._id.toString(),
      });

      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if new name conflicts with existing category
    if (categoryName && categoryName !== category.categoryName) {
      const existingCategory = await Category.findOne({ categoryName });
      if (existingCategory) {
        logger.warn('Category name already exists', {
          categoryName,
          userId: req.user._id.toString(),
        });

        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
      }
    }

    // Update category
    category.categoryName = categoryName || category.categoryName;
    category.discount = discount !== undefined ? discount : category.discount;
    category.updatedBy = req.user._id;

    await category.save();

    logger.info('Category updated successfully', {
      categoryId: category._id.toString(),
      categoryName: category.categoryName,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    logger.error('Error updating category', {
      categoryId: req.params.id,
      error: error.message,
      stack: error.stack,
      userId: req.user?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message,
    });
  }
};

/**
 * @desc    Update category status (activate/deactivate)
 * @route   PATCH /api/v1/category/:id/status
 * @access  Private (Admin only)
 */
exports.updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    logger.info('Updating category status', {
      categoryId: id,
      newStatus: isActive,
      userId: req.user._id.toString(),
      userName: req.user.userName,
    });

    const category = await Category.findById(id);
    if (!category) {
      logger.warn('Category not found for status update', {
        categoryId: id,
        userId: req.user._id.toString(),
      });

      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    category.isActive = isActive;
    category.updatedBy = req.user._id;
    await category.save();

    logger.info('Category status updated successfully', {
      categoryId: category._id.toString(),
      categoryName: category.categoryName,
      newStatus: isActive,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    logger.error('Error updating category status', {
      categoryId: req.params.id,
      error: error.message,
      stack: error.stack,
      userId: req.user?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error updating category status',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/category/:id
 * @access  Private (Admin only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Deleting category', {
      categoryId: id,
      userId: req.user._id.toString(),
      userName: req.user.userName,
    });

    const category = await Category.findById(id);
    if (!category) {
      logger.warn('Category not found for deletion', {
        categoryId: id,
        userId: req.user._id.toString(),
      });

      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has items (you might want to prevent deletion)
    // const Item = require('../models/Item.model');
    // const itemCount = await Item.countDocuments({ categoryId: id });
    // if (itemCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete category. It has ${itemCount} items associated with it.`,
    //   });
    // }

    await category.deleteOne();

    logger.info('Category deleted successfully', {
      categoryId: id,
      categoryName: category.categoryName,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting category', {
      categoryId: req.params.id,
      error: error.message,
      stack: error.stack,
      userId: req.user?._id.toString(),
    });

    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message,
    });
  }
};
