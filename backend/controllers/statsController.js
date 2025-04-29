const {
    getRevenueByDay,
    getRidesByArea,
    getRidesByDriver,
    getRidesByCustomer,
    getRideStatsByLocation,
    getPerformanceData
  } = require('../services/statsService');
  
  /**
   * Get revenue statistics by day
   * @route GET /api/stats/revenue
   */
  exports.getRevenueStats = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Default to last 30 days if dates not provided
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const stats = await getRevenueByDay(start, end);
      
      res.status(200).json({
        message: 'Revenue statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      res.status(500).json({ message: 'Error getting revenue statistics' });
    }
  };
  
  /**
   * Get ride statistics by area
   * @route GET /api/stats/rides-by-area
   */
  exports.getRidesByAreaStats = async (req, res) => {
    try {
      const stats = await getRidesByArea();
      
      res.status(200).json({
        message: 'Ride statistics by area retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting area stats:', error);
      res.status(500).json({ message: 'Error getting ride statistics by area' });
    }
  };
  
  /**
   * Get graph data (drivers, customers, areas)
   * @route GET /api/stats/graph-data
   */
  exports.getGraphData = async (req, res) => {
    try {
      const { type } = req.query;
      
      let data;
      
      switch (type) {
        case 'drivers':
          data = await getRidesByDriver();
          break;
        case 'customers':
          data = await getRidesByCustomer();
          break;
        case 'areas':
          data = await getRidesByArea();
          break;
        case 'heatmap':
          data = await getRideStatsByLocation();
          break;
        case 'performance':
          data = await getPerformanceData();
          break;
        default:
          return res.status(400).json({ message: 'Invalid graph type' });
      }
      
      res.status(200).json({
        message: `Graph data for ${type} retrieved successfully`,
        data
      });
    } catch (error) {
      console.error('Error getting graph data:', error);
      res.status(500).json({ message: 'Error getting graph data' });
    }
  };