const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token provided',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sportverse_default_secret_key'
      );

      req.user = {
        userId: decoded.userId || decoded.id || decoded._id,
        role: decoded.role,
        email: decoded.email,
      };

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized, no token provided',
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
