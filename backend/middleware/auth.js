const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const secret = JWT_SECRET || 'dev_only_jwt_secret_change_me';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('_id name email avatar_url');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token user' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

module.exports = auth;
