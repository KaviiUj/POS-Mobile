const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
tableSchema.index({ isAvailable: 1 });
tableSchema.index({ tableName: 1 });

// Method to make table available
tableSchema.methods.makeAvailable = function () {
  this.isAvailable = true;
  this.orderId = null;
};

// Method to occupy table with order
tableSchema.methods.occupyWithOrder = function (orderId) {
  this.isAvailable = false;
  this.orderId = orderId;
};

module.exports = mongoose.model('Table', tableSchema);

