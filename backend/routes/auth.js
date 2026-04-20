const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(200).required(),
  password: Joi.string().min(6).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(200).required(),
  password: Joi.string().min(6).max(100).required(),
});

const profileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  avatar_url: Joi.string().trim().uri().max(500).allow('', null).optional(),
});

const forgotSchema = Joi.object({
  email: Joi.string().trim().email().max(200).required(),
});

const resetSchema = Joi.object({
  token: Joi.string().trim().length(64).required(),
  password: Joi.string().min(6).max(100).required(),
});

function signToken(user) {
  const secret = JWT_SECRET || 'dev_only_jwt_secret_change_me';
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    secret,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const email = value.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, error: 'Email already registered' });

    const password_hash = await bcrypt.hash(value.password, 10);
    const user = await User.create({ name: value.name, email, password_hash });
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar_url: user.avatar_url || null },
    });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const ok = await bcrypt.compare(value.password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const token = signToken(user);
    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar_url: user.avatar_url || null },
    });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar_url: req.user.avatar_url || null,
    },
  });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { error, value } = profileSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: value.name,
        avatar_url: value.avatar_url || null,
      },
      { new: true }
    ).select('_id name email avatar_url');

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url || null,
      },
    });
  } catch (err) {
    console.error('PUT /auth/profile error:', err);
    return res.status(500).json({ success: false, error: 'Profile update failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { error, value } = forgotSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If the account exists, a reset token was generated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.reset_token_hash = tokenHash;
    user.reset_token_expires_at = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset token generated. In production send this via email.',
      ...(process.env.NODE_ENV !== 'production' || process.env.ALLOW_RESET_TOKEN_RESPONSE === 'true'
        ? { resetToken: token }
        : {}),
      expiresInMinutes: 15,
    });
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate reset token' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = resetSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const tokenHash = crypto.createHash('sha256').update(value.token).digest('hex');
    const user = await User.findOne({
      reset_token_hash: tokenHash,
      reset_token_expires_at: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    user.password_hash = await bcrypt.hash(value.password, 10);
    user.reset_token_hash = null;
    user.reset_token_expires_at = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('POST /auth/reset-password error:', err);
    return res.status(500).json({ success: false, error: 'Password reset failed' });
  }
});

module.exports = router;
