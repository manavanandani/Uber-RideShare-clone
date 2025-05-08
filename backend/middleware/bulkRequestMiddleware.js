const { invalidateCache } = require('../config/redis');

/**
 * Middleware to handle bulk operations
 * This is used for performance testing with many operations
 */
const bulkRequestHandler = (controller) => {
  return async (req, res) => {
    try {
      // Check if this is a bulk operation request
      if (req.body.bulk && Array.isArray(req.body.items)) {
        const items = req.body.items;
        
        if (items.length === 0) {
          return res.status(400).json({
            message: 'No items provided for bulk operation'
          });
        }
        
        console.log(`Processing bulk operation with ${items.length} items`);
        
        // Process items in batches to prevent overloading
        const batchSize = 100;
        const results = [];
        const errors = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          
          // Process batch using Promise.all for parallelism
          const batchPromises = batch.map(async (item) => {
            try {
              const mockReq = { 
                body: item, 
                user: req.user,
                headers: req.headers
              };
              
              const mockRes = {
                status: (code) => {
                  return {
                    json: (data) => {
                      return { status: code, data };
                    }
                  };
                }
              };
              
              const result = await controller(mockReq, mockRes);
              
              if (result.status >= 200 && result.status < 300) {
                results.push(result.data);
              } else {
                errors.push({
                  item,
                  error: result.data
                });
              }
              
              return result;
            } catch (error) {
              errors.push({
                item,
                error: error.message
              });
              return { status: 500, data: { message: error.message } };
            }
          });
          
          await Promise.all(batchPromises);
          
          // Log progress for large batches
          if (items.length > 1000 && (i + batchSize) % 1000 === 0) {
            console.log(`Processed ${i + batchSize} of ${items.length} items`);
          }
        }
        
        // Invalidate relevant caches
        await invalidateCache('*');
        
        return res.status(200).json({
          message: `Bulk operation completed: ${results.length} succeeded, ${errors.length} failed`,
          succeeded: results.length,
          failed: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        });
      }
      
      // If not a bulk operation, call the controller normally
      return controller(req, res);
    } catch (error) {
      console.error('Error in bulk request handler:', error);
      res.status(500).json({
        message: 'Error processing bulk request',
        error: error.message
      });
    }
  };
};

module.exports = bulkRequestHandler;