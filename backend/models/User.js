const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  profileImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  recentViews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place'
  }],
  preferences: {
    type: Object,
    default: {}
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 