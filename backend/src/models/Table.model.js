const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurantCode: {
      type: String,
      required: [true, 'Restaurant code is required'],
      trim: true,
      index: true,
    },
    tableName: {
      type: String,
      required: [true, 'Please provide table name'],
      unique: true,
      trim: true,
      minlength: [1, 'Table name must be at least 1 character'],
      maxlength: [50, 'Table name cannot exceed 50 characters'],
    },
    pax: {
      type: Number,
      default: 4,
      min: [1, 'Pax must be at least 1'],
      max: [50, 'Pax cannot exceed 50'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    orderId: {
      type: String,
      default: null,
    },
    // Session PIN for order verification
    sessionPin: {
      type: String,
      default: null,
    },
    pinGeneratedAt: {
      type: Date,
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
tableSchema.index({ restaurantCode: 1 });
tableSchema.index({ isAvailable: 1 });
tableSchema.index({ tableName: 1 });

// Generate 6-digit PIN
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Method to make table available
tableSchema.methods.makeAvailable = function () {
  this.isAvailable = true;
  this.orderId = null;
  this.sessionPin = null;
  this.pinGeneratedAt = null;
  this.customerId = null;
};

// Method to occupy table with order
tableSchema.methods.occupyWithOrder = function (orderId) {
  this.isAvailable = false;
  this.orderId = orderId;
};

// Method to generate and set session PIN
tableSchema.methods.generateSessionPin = function (customerId) {
  this.sessionPin = generatePin();
  this.pinGeneratedAt = new Date();
  this.customerId = customerId;
  return this.sessionPin;
};

// Method to verify PIN
tableSchema.methods.verifyPin = function (inputPin) {
  if (!this.sessionPin) {
    return false;
  }
  return this.sessionPin === inputPin.toString();
};

// Method to clear session PIN
tableSchema.methods.clearSessionPin = function () {
  this.sessionPin = null;
  this.pinGeneratedAt = null;
  this.customerId = null;
};

module.exports = mongoose.model('Table', tableSchema);

