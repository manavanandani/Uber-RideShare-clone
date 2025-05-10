const jwt = require('jsonwebtoken');


const verifyRole = (roles) => {
  if (!Array.isArray(roles)) {
    roles = [roles]; // Convert single role to array
  }

  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userRole = decoded.role;
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied: insufficient role' });
      }

      // Attach user info from token to the request (no DB lookups)
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      console.error('verifyRole error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = verifyRole;
