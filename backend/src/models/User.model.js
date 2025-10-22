const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    passWord: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: Number,
      required: true,
      enum: [99, 89], // 99 = Admin, 89 = Staff
      default: 89,
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('passWord')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passWord = await bcrypt.hash(this.passWord, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passWord);
};

// Get role name helper
userSchema.methods.getRoleName = function () {
  return this.role === 99 ? 'Admin' : 'Staff';
};

module.exports = mongoose.model('User', userSchema);
