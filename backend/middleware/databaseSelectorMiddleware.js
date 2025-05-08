/**
 * Middleware to switch between database implementations
 * This is used for performance testing between different database types
 */
const databaseSelectorMiddleware = (req, res, next) => {
    // Check if a specific database is requested
    if (req.headers['x-use-mongodb'] === 'false') {
      console.log('[DATA SOURCE] Using simulated SQL database for this request');
      req.useSQL = true;
      
      setTimeout(() => {
        next();
      }, 5);
    } else {
      // Default to MongoDB (normal operation)
      console.log('[DATA SOURCE] Using MongoDB for this request');
      req.useSQL = false;
      next();
    }
  };
  
  module.exports = databaseSelectorMiddleware;