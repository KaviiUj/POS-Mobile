const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    reason: {
      type: String,
      default: 'expired',
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

// Auto-delete blacklisted tokens after expiration (TTL index)
tokenBlacklistSchema.index({ restaurantCode: 1 });
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenBlacklistSchema.index({ userId: 1 });
tokenBlacklistSchema.index({ customerId: 1 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

