const { invalidateCache } = require('../config/redis');
const { CustomError } = require('../../../shared/utils/errors');

/**
 * Middleware to handle bulk operations
 * Used for performance testing with many operations
 */
const bulkRequestHandler = (controller) => {
  return async (req, res) => {
    try {
      // Check if this is a bulk operation request
      if (req.body.bulk && Array.isArray(req.body.items)) {
        const items = req.body.items;
        if (items.length === 0) {
          throw new CustomError('No items provided for bulk operation', 400);
        }

        console.log(`Processing bulk operation with ${items.length} items`);

        // Process items in batches
        const batchSize = 100;
        const results = [];
        const errors = [];

        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchPromises = batch.map(async (item) => {
            try {
              const mockReq = {
                body: item,
                user: req.user,
                headers: req.headers
              };
              const mockRes = {
                status: (code) => ({
                  json: (data) => ({ status: code, data })
                })
              };
              const result = await controller(mockReq, mockRes);
              if (result.status >= 200 && result.status < 300) {
                results.push(result.data);
              } else {
                errors.push({ item, error: result.data });
              }
              return result;
            } catch (error) {
              errors.push({ item, error: error.message });
              return { status: 500, data: { message: error.message } };
            }
          });

          await Promise.all(batchPromises);

          if (items.length > 1000 && (i + batchSize) % 1000 === 0) {
            console.log(`Processed ${i + batchSize} of ${items.length} items`);
          }
        }

        // Invalidate caches
        await invalidateCache('*');

        return res.status(200).json({
          message: `Bulk operation completed: ${results.length} succeeded, ${errors.length} failed`,
          succeeded: results.length,
          failed: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        });
      }

      // Single operation
      return controller(req, res);
    } catch (error) {
      console.error('Error in bulk request handler:', error);
      const status = error instanceof CustomError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
};

module.exports = bulkRequestHandler;