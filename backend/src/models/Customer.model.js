const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    restaurantCode: {
      type: String,
      required: [true, 'Restaurant code is required'],
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: Number,
      required: [true, 'Mobile number is required'],
      validate: {
        validator: function (v) {
          return v && v.toString().length <= 9;
        },
        message: 'Mobile number must be maximum 9 digits',
      },
    },
    uniqueId: {
      type: Number,
      required: true,
      unique: true,
    },
    mobileType: {
      type: String,
      enum: ['android', 'ios'],
      required: [true, 'Mobile type is required'],
    },
    orderId: {
      type: String,
      default: '',
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    tableName: {
      type: String,
      default: '',
    },
    // Session Management Fields
    sessionActive: {
      type: Boolean,
      default: false,
    },
    sessionStartedAt: {
      type: Date,
      default: null,
    },
    sessionEndedAt: {
      type: Date,
      default: null,
    },
    activeOrderIds: {
      type: [String],
      default: [],
    },
    lastOrderId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (unique fields already indexed automatically)
customerSchema.index({ restaurantCode: 1 });
customerSchema.index({ sessionActive: 1 });
customerSchema.index({ sessionStartedAt: 1 });

// Method to start a new session
customerSchema.methods.startSession = function (tableId, tableName) {
  this.sessionActive = true;
  this.sessionStartedAt = new Date();
  this.sessionEndedAt = null;
  this.tableId = tableId;
  this.tableName = tableName;
  this.activeOrderIds = [];
};

// Method to end session
customerSchema.methods.endSession = function () {
  this.sessionActive = false;
  this.sessionEndedAt = new Date();
  this.tableId = null;
  this.tableName = '';
  this.orderId = '';
  this.activeOrderIds = [];
};

// Method to add order to session
customerSchema.methods.addOrderToSession = function (orderNumber) {
  if (!this.activeOrderIds.includes(orderNumber)) {
    this.activeOrderIds.push(orderNumber);
  }
  this.lastOrderId = orderNumber;
  this.orderId = orderNumber; // Keep for backward compatibility
};

module.exports = mongoose.model('Customer', customerSchema);

