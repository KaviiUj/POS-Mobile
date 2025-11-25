const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    restaurantCode: {
      type: String,
      required: [true, 'Restaurant code is required'],
      trim: true,
      index: true,
    },
    staffName: {
      type: String,
      required: [true, 'Please provide staff name'],
      trim: true,
      minlength: [3, 'Staff name must be at least 3 characters'],
      maxlength: [100, 'Staff name cannot exceed 100 characters'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: Number,
      default: 89, // 89 = Staff
      enum: [89],
    },
    mobileNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10,15}$/.test(v);
        },
        message: 'Please provide a valid mobile number (10-15 digits)',
      },
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    nic: {
      type: String,
      trim: true,
      maxlength: [50, 'NIC cannot exceed 50 characters'],
    },
    profileImageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
staffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
staffSchema.index({ restaurantCode: 1 });
staffSchema.index({ staffName: 1 });
staffSchema.index({ isActive: 1 });

module.exports = mongoose.model('Staff', staffSchema);

