const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sahithyolsav_super_secret_jwt_key_987654321');

      // Get user from the token, excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ success: false, message: 'User account is deactivated' });
      }

      if (req.user.mustChangePassword && !(req.baseUrl === '/api/auth' && req.path === '/profile')) {
        return res.status(403).json({
          success: false,
          mustChangePassword: true,
          message: 'Password change required before accessing other resources',
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
