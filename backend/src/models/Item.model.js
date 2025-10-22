const mongoose = require('mongoose');

const modifierSchema = new mongoose.Schema({
  modifierName: {
    type: String,
    required: true,
    trim: true,
  },
  modifierPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const itemSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide category ID'],
    },
    categoryName: {
      type: String,
      required: [true, 'Please provide category name'],
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [200, 'Item name cannot exceed 200 characters'],
    },
    itemDescription: {
      type: String,
      required: [true, 'Please provide item description'],
      trim: true,
      maxlength: [1000, 'Item description cannot exceed 1000 characters'],
    },
    itemImage: {
      type: String,
      required: [true, 'Please provide item image'],
    },
    isVeg: {
      type: Boolean,
      required: true,
      default: true,
    },
    cuisine: {
      type: String,
      trim: true,
      maxlength: [100, 'Cuisine cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide item price'],
      min: [0, 'Price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    modifiers: [modifierSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
itemSchema.index({ categoryId: 1, isActive: 1 });
itemSchema.index({ itemName: 1 });
itemSchema.index({ isVeg: 1 });
itemSchema.index({ cuisine: 1 });
itemSchema.index({ createdBy: 1 });

// Calculate final price after discount
itemSchema.methods.getFinalPrice = function () {
  const discountAmount = (this.price * this.discount) / 100;
  return this.price - discountAmount;
};

module.exports = mongoose.model('Item', itemSchema);

