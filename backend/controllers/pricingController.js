const { getDynamicPrice } = require('../services/pricingService');

/**
 * Get fare estimate for a ride
 * @route POST /api/pricing/estimate
 */
exports.getFareEstimate = async (req, res) => {
  try {
    const {
      pickup_latitude,
      pickup_longitude,
      dropoff_latitude,
      dropoff_longitude,
      datetime,
      passenger_count
    } = req.body;
    
    // Validate inputs
    if (!pickup_latitude || !pickup_longitude || !dropoff_latitude || !dropoff_longitude) {
      return res.status(400).json({ message: 'Missing location coordinates' });
    }
    
    const pickup = { latitude: pickup_latitude, longitude: pickup_longitude };
    const dropoff = { latitude: dropoff_latitude, longitude: dropoff_longitude };
    const dateObj = datetime ? new Date(datetime) : new Date();
    const passengers = passenger_count || 1;
    
    // Get price estimate
    const priceEstimate = await getDynamicPrice(pickup, dropoff, dateObj, passengers);
    
    res.status(200).json({
      message: 'Fare estimate calculated successfully',
      data: priceEstimate
    });
  } catch (error) {
    console.error('Error calculating fare estimate:', error);
    res.status(500).json({ message: 'Error calculating fare estimate' });
  }
};