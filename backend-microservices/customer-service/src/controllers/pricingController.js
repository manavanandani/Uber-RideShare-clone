const { getDynamicPrice, calculateDistance, estimateRideDuration } = require('../services/pricingService');

/**
 * Get fare estimate for a ride
 * @route POST /api/pricing/estimate
 */
exports.getFareEstimate = async (req, res) => {
  try {
    console.log('Fare estimate request received:', req.body);
    
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
    
    const pickup = { 
      latitude: parseFloat(pickup_latitude), 
      longitude: parseFloat(pickup_longitude) 
    };
    const dropoff = { 
      latitude: parseFloat(dropoff_latitude), 
      longitude: parseFloat(dropoff_longitude) 
    };
    const dateObj = datetime ? new Date(datetime) : new Date();
    const passengers = parseInt(passenger_count) || 1;
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Fare calculation timeout')), 4000);
    });
    
    // Race the price calculation with a timeout
    let priceEstimate;
    try {
      priceEstimate = await Promise.race([
        getDynamicPrice(pickup, dropoff, dateObj, passengers),
        timeoutPromise
      ]);
    } catch (timeoutError) {
      console.error('Fare calculation timed out:', timeoutError);
      
      // Fallback calculation if getDynamicPrice times out
      const distance = calculateDistance(pickup, dropoff);
      const duration = estimateRideDuration(distance);
      const baseFare = 3.0;
      const distanceFare = distance * 1.5;
      const timeFare = duration * 0.2;
      const fare = baseFare + distanceFare + timeFare;
      
      priceEstimate = {
        fare: Math.round(fare * 100) / 100,
        distance: distance,
        duration: duration,
        demandSurge: 1.0,
        breakdown: {
          base_fare: baseFare,
          distance_fare: distanceFare,
          time_fare: timeFare,
          surge_multiplier: 1.0
        }
      };
    }
    
    console.log('Sending price estimate response:', priceEstimate);
    
    res.status(200).json({
      message: 'Fare estimate calculated successfully',
      data: priceEstimate
    });
  } catch (error) {
    console.error('Error calculating fare estimate:', error);
    
    // Fallback calculation if getDynamicPrice fails completely
    try {
      const { 
        pickup_latitude,
        pickup_longitude,
        dropoff_latitude,
        dropoff_longitude
      } = req.body;
      
      const pickup = { 
        latitude: parseFloat(pickup_latitude), 
        longitude: parseFloat(pickup_longitude) 
      };
      const dropoff = { 
        latitude: parseFloat(dropoff_latitude), 
        longitude: parseFloat(dropoff_longitude) 
      };
      
      // Basic fare calculation using imported functions
      const distance = calculateDistance(pickup, dropoff);
      const duration = estimateRideDuration(distance);
      const baseFare = 3.0;
      const distanceFare = distance * 1.5;
      const timeFare = duration * 0.2;
      const fare = baseFare + distanceFare + timeFare;
      
      const fallbackEstimate = {
        fare: Math.round(fare * 100) / 100,
        distance: distance,
        duration: duration,
        demandSurge: 1.0,
        breakdown: {
          base_fare: baseFare,
          distance_fare: distanceFare,
          time_fare: timeFare,
          surge_multiplier: 1.0
        }
      };
      
      console.log('Sending fallback price estimate:', fallbackEstimate);
      
      return res.status(200).json({
        message: 'Approximate fare estimate calculated',
        data: fallbackEstimate
      });
    } catch (fallbackError) {
      console.error('Fallback calculation failed:', fallbackError);
      res.status(500).json({ message: 'Error calculating fare estimate' });
    }
  }
};