// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if user is not a Google or GitHub user
      return !this.isGoogleUser && !this.isGithubUser;
    }
  },
  role: {
    type: String,
    enum: ['project_admin', 'employee'],
    required: function() {
      // Role is required only if profile is complete
      return this.profileComplete !== false;
    }
  },
  dob: {
    type: Date,
    required: function() {
      return this.profileComplete !== false;
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() {
      return this.profileComplete !== false;
    }
  },
  skills: {
    type: [String],
    default: []
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  isGithubUser: {
    type: Boolean,
    default: false
  },
  profileComplete: {
    type: Boolean,
    default: true // Default to true for regular signup, false for Google/GitHub users initially
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only for non-Google users)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);