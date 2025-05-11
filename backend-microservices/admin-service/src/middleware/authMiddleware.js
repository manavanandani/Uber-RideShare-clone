const jwt = require('jsonwebtoken');
const { CustomError } = require('../../../shared/utils/errors');

const authMiddleware = (roles = ['admin']) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError('No token provided', 401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (roles && !roles.includes(decoded.role)) {
        throw new CustomError('Access denied: insufficient role', 403);
      }

      req.user = { admin_id: decoded.admin_id || decoded.id, role: decoded.role };
      next();
    } catch (error) {
      const status = error instanceof CustomError ? error.status : 401;
      res.status(status).json({ message: error.message });
    }
  };
};

module.exports = { authMiddleware };