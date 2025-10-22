const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
      },
    ],
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
cartSchema.index({ userId: 1 });
cartSchema.index({ mobileNumber: 1 });
cartSchema.index({ orderIsPlaced: 1 });
cartSchema.index({ orderId: 1 });
cartSchema.index({ tableId: 1 });

module.exports = mongoose.model('Cart', cartSchema);

