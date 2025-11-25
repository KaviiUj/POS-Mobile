const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    restaurantCode: {
      type: String,
      required: [true, 'Restaurant code is required'],
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
    },
    items: [String], // Store as string array instead of ObjectId
    orderId: {
      type: String,
      default: '',
    },
    tableId: {
      type: String,
      default: '',
    },
    tableName: {
      type: String,
      default: '',
    },
    orderIsPlaced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
cartSchema.index({ restaurantCode: 1 });
cartSchema.index({ userId: 1 });
cartSchema.index({ mobileNumber: 1 });
cartSchema.index({ orderIsPlaced: 1 });
cartSchema.index({ orderId: 1 });
cartSchema.index({ tableId: 1 });

module.exports = mongoose.model('Cart', cartSchema);

