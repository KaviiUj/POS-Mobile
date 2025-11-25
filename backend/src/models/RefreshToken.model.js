const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    restaurantCode: {
      type: String,
      required: [true, 'Restaurant code is required'],
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired refresh tokens (TTL index)
refreshTokenSchema.index({ restaurantCode: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ customerId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

