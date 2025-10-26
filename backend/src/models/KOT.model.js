const mongoose = require('mongoose');

const kotSchema = new mongoose.Schema(
  {
    kotId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    parentKotId: {
      type: String,
      default: null,
      trim: true,
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      trim: true,
    },
    kotType: {
      type: String,
      enum: ['NEW_ORDER', 'ORDER_AMENDMENT'],
      required: [true, 'KOT type is required'],
    },
    tableName: {
      type: String,
      required: [true, 'Table name is required'],
      trim: true,
    },
    items: [
      {
        itemId: {
          type: String,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        modifiers: [{
          modifierName: String,
          modifierPrice: Number,
        }],
        kotStatus: {
          type: String,
          enum: ['PENDING', 'PREPARING', 'READY'],
          default: 'PENDING',
        },
        price: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    amendmentReason: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    kitchenStatus: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'COMPLETED'],
      default: 'PENDING',
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
kotSchema.index({ kotId: 1 });
kotSchema.index({ orderId: 1 });
kotSchema.index({ kotType: 1 });
kotSchema.index({ kitchenStatus: 1 });
kotSchema.index({ timestamp: 1 });

// Generate KOT ID
const generateKOTId = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `KOT-${dateStr}-${timeStr}`;
};

// Method to generate KOT ID
kotSchema.statics.generateKOTId = generateKOTId;

// Method to acknowledge KOT
kotSchema.methods.acknowledge = function (acknowledgedBy) {
  this.kitchenStatus = 'ACKNOWLEDGED';
  this.acknowledgedBy = acknowledgedBy;
  this.acknowledgedAt = new Date();
};

// Method to mark KOT as completed
kotSchema.methods.complete = function () {
  this.kitchenStatus = 'COMPLETED';
  this.completedAt = new Date();
};

// Method to update item status
kotSchema.methods.updateItemStatus = function (itemIndex, status) {
  if (this.items[itemIndex]) {
    this.items[itemIndex].kotStatus = status;
  }
};

module.exports = mongoose.model('KOT', kotSchema);
