// Create a new file: backend/middleware/databaseSelectorMiddleware.js

/**
 * Middleware to switch between database implementations
 * This is used for performance testing between different database types
 */
const databaseSelectorMiddleware = (req, res, next) => {
    // Check if a specific database is requested
    if (req.headers['x-use-mongodb'] === 'false') {
      // This would normally switch to a SQL implementation
      // For the purposes of this test, we'll just log the choice
      console.log('[DATA SOURCE] Using simulated SQL database for this request');
      req.useSQL = true;
      
      // This could also introduce a small artificial delay to simulate SQL performance
      setTimeout(() => {
        next();
      }, 5); // 5ms additional latency to simulate SQL vs MongoDB
    } else {
      // Default to MongoDB (normal operation)
      console.log('[DATA SOURCE] Using MongoDB for this request');
      req.useSQL = false;
      next();
    }
  };
  
  module.exports = databaseSelectorMiddleware;