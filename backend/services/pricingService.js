// services/pricingService.js 
const axios = require('axios');
const haversine = require('haversine');
const { redisClient } = require('../config/redis');

// Keep basic pricing constants for reference and fallback
const BASE_FARE = 3.0;
const COST_PER_KM = 1.5;
const COST_PER_MINUTE = 0.2;

/**
 * Calculate distance between two coordinates using haversine formula
 */
const calculateDistance = (pickup, dropoff) => {
    const pickupPoint = {
        latitude: pickup.latitude, 
        longitude: pickup.longitude
      };
      
      const dropoffPoint = {
        latitude: dropoff.latitude, 
        longitude: dropoff.longitude
      };
      
      return haversine(pickupPoint, dropoffPoint, { unit: 'km' });
};

/**
 * Estimate ride duration based on distance and average speed
 */
const estimateRideDuration = (distanceKm) => {
    const avgSpeedKmPerHour = 30; // Average urban speed
    return (distanceKm / avgSpeedKmPerHour) * 60; // Returns minutes
};

/**
 * Get fare prediction from ML model via FastAPI
 */
const getPredictedFare = async (pickup, dropoff, dateTime, passengerCount) => {
    try {
        const timestamp = new Date(dateTime).toISOString();
        
        console.log('Sending prediction request to ML API with data:', {
            pickup, dropoff, dateTime, passengerCount
        });
        
        const response = await axios.post(process.env.ML_API_URL || 'http://localhost:8000/predict', {
            pickup_datetime: timestamp,
            passenger_count: passengerCount,
            pickup_longitude: pickup.longitude,
            pickup_latitude: pickup.latitude,
            dropoff_longitude: dropoff.longitude,
            dropoff_latitude: dropoff.latitude
        });
        
        console.log('Received ML prediction response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting fare prediction from ML model:', error);
        
        // Calculate basic fare for fallback
        const distance = calculateDistance(pickup, dropoff);
        const duration = estimateRideDuration(distance);
        const baseFare = BASE_FARE;
        const distanceFare = distance * COST_PER_KM;
        const timeFare = duration * COST_PER_MINUTE;
        
        return {
            status: 'fallback',
            predicted_fare: baseFare + distanceFare + timeFare,
            distance_km: distance,
            surge_factor: 1.0 // Default to no surge in fallback
        };
    }
};

/**
 * Complete dynamic pricing function - simplified to rely on ML model
 */
const getDynamicPrice = async (pickup, dropoff, dateTime = new Date(), passengerCount = 1) => {
    try {
        console.log('getDynamicPrice called with:', { pickup, dropoff, dateTime, passengerCount });
        
        // Calculate distance and duration directly for immediate use
        const distance = calculateDistance(pickup, dropoff);
        const duration = estimateRideDuration(distance);
        
        // Basic fare calculation as fallback
        const baseFare = BASE_FARE;
        const distanceFare = distance * COST_PER_KM;
        const timeFare = duration * COST_PER_MINUTE;
        const basicFare = baseFare + distanceFare + timeFare;
        
        // Try to get from cache first
        const cacheKey = `price:${pickup.latitude.toFixed(4)}:${pickup.longitude.toFixed(4)}:${dropoff.latitude.toFixed(4)}:${dropoff.longitude.toFixed(4)}:${passengerCount}:${dateTime.getHours()}`;
        
        try {
            const cachedPrice = await redisClient.get(cacheKey);
            if (cachedPrice) {
                console.log('Using cached price');
                return JSON.parse(cachedPrice);
            }
        } catch (cacheError) {
            console.error('Cache error, continuing with calculation:', cacheError);
            // Continue with calculation if cache fails
        }
        
        // Try ML model but handle gracefully if it fails
        let mlPrediction;
        let surgeFactor = 1.0;
        
        try {
            mlPrediction = await getPredictedFare(pickup, dropoff, dateTime, passengerCount);
            surgeFactor = mlPrediction.surge_factor || 1.2; // Default surge if not provided
        } catch (mlError) {
            console.log('ML model error, using basic calculation:', mlError);
            // Apply time-based surge as fallback
            const hour = dateTime.getHours();
            const isWeekend = [0, 6].includes(dateTime.getDay());
            
            // Simple surge logic based on time of day
            if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
                // Rush hour surge
                surgeFactor = 1.5;
            } else if (hour >= 22 || hour <= 3) {
                // Night surge
                surgeFactor = isWeekend ? 1.8 : 1.3;
            }
            
            mlPrediction = {
                predicted_fare: basicFare * surgeFactor,
                distance_km: distance
            };
        }
        
        // Final result with all needed info
        const result = {
            fare: Math.round(mlPrediction.predicted_fare * 100) / 100, // Round to 2 decimal places
            distance: distance,
            duration: duration,
            demandSurge: surgeFactor,
            breakdown: {
                base_fare: baseFare,
                distance_fare: distanceFare,
                time_fare: timeFare,
                surge_multiplier: surgeFactor
            }
        };
        
        console.log('Final price calculation result:', result);
        
        // Cache for 3 minutes
        try {
            await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 180);
        } catch (cacheError) {
            console.error('Failed to cache result:', cacheError);
            // Continue without caching
        }
        
        return result;
    } catch (error) {
        console.error('Error in dynamic pricing:', error);
        
        // Emergency fallback if everything else fails
        const distance = calculateDistance(pickup, dropoff);
        const duration = estimateRideDuration(distance);
        const fare = BASE_FARE + (distance * COST_PER_KM) + (duration * COST_PER_MINUTE);
        
        const result = {
            fare: Math.round(fare * 100) / 100,
            distance: distance,
            duration: duration,
            demandSurge: 1.0,
            breakdown: {
                base_fare: BASE_FARE,
                distance_fare: distance * COST_PER_KM,
                time_fare: duration * COST_PER_MINUTE,
                surge_multiplier: 1.0
            }
        };
        
        console.log('Emergency fallback price calculation:', result);
        return result;
    }
};

/**
 * Record actual pricing data for model improvement
 */
const recordPricingData = async (rideData) => {
  try {
    // This could write to a database table or send to a data collection service
    const pricingRecord = {
      timestamp: new Date(),
      pickup_location: rideData.pickup_location,
      dropoff_location: rideData.dropoff_location,
      passenger_count: rideData.passenger_count,
      predicted_fare: rideData.fare_amount,
      actual_fare: rideData.fare_amount, // Same for now, could be adjusted
      surge_factor: rideData.surge_factor,
      distance_km: rideData.distance,
      duration: rideData.duration,
      // Customer behavior data
      was_accepted: true // Could be updated later when we know if ride was accepted
    };
    
    // Store in Redis for later analysis and model retraining
    try {
      await redisClient.rpush('pricing_data_queue', JSON.stringify(pricingRecord));
    } catch (redisError) {
      console.error('Error storing pricing data in Redis:', redisError);
      // Continue without storing
    }
    
    return true;
  } catch (error) {
    console.error('Error recording pricing data:', error);
    return false;
  }
};

module.exports = {
    calculateDistance,
    estimateRideDuration,
    getPredictedFare,
    getDynamicPrice,
    recordPricingData
};