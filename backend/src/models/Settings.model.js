const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      trim: true,
      maxlength: [500, 'Logo URL cannot exceed 500 characters'],
    },
    showCuisineFilter: {
      type: Boolean,
      default: true,
    },
    showModifiers: {
      type: Boolean,
      default: true,
    },
    showModifiersPrice: {
      type: Boolean,
      default: true,
    },
    outletName: {
      type: String,
      trim: true,
      minlength: [2, 'Outlet name must be at least 2 characters'],
      maxlength: [100, 'Outlet name cannot exceed 100 characters'],
      default: 'My Restaurant',
    },
    outletCurrency: {
      type: String,
      trim: true,
      minlength: [1, 'Currency code must be at least 1 character'],
      maxlength: [10, 'Currency code cannot exceed 10 characters'],
      default: 'USD',
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

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

