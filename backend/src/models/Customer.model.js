const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (unique fields already indexed automatically)

module.exports = mongoose.model('Customer', customerSchema);

