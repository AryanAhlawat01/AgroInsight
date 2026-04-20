const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    password_hash: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    reset_token_hash: {
      type: String,
      default: null,
    },
    reset_token_expires_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('User', userSchema);
