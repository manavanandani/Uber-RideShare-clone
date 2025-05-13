const axios = require('axios');
const haversine = require('haversine');
const geohash = require('ngeohash');
const { redis } = require('../config/redis');

// Keep basic pricing constants for reference and fallback
const BASE_FARE = 3.0;
const COST_PER_KM = 1.5;
const COST_PER_MINUTE = 0.2;

/**
 * Calculate the surge multiplier based on demand
 */
function surgeMultiplier(demand) {
    if (demand < 5) return 1.0;
    return 1 + 2 * (1 / (1 + Math.exp(-0.05 * (demand - 50))));
}

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
 * Get surge factor based on demand in the area
*/
const getSurgeFactor = async (dropoff, dateTime) => {
    try {
        const time = new Date(dateTime);
        const minutes = time.getMinutes();
        const timeBucket = new Date(time.getTime() - (minutes % 15) * 60000);
        const bucketTimestamps = [];

        for (let i = 0; i < 4; i++) {
            const bucketTime = new Date(timeBucket.getTime() - i * 15 * 60000);
            const keyTime = bucketTime.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
            bucketTimestamps.push(keyTime);
        }

        const geoHash = geohash.encode(dropoff.latitude, dropoff.longitude, 6); // ~1km
        const weights = [1, 0.5, 0.3, 0.1];
        let totalDemand = 0;
        let redisFailures = 0;

        for (let i = 0; i < bucketTimestamps.length; i++) {
            const key = `demand:${bucketTimestamps[i]}_${geoHash}`;
            try {
                const count = await redisClient.get(key);
                const parsedCount = count !== null ? Number(count) : 0;
                totalDemand += !isNaN(parsedCount) ? parsedCount * weights[i] : 0;
            } catch (e) {
                console.error(`Redis error reading ${key}:`, e);
                redisFailures++;
            }
        }

        if (redisFailures >= bucketTimestamps.length / 2) {
            console.warn(`More than half of Redis operations failed, using default surge factor`);
            return 1.0; // Default to no surge if Redis is mostly unavailable
        }
            

        // Increment current demand bucket
        try {
            const currentKey = `demand:${bucketTimestamps[0]}_${geoHash}`;
            await redisClient.incr(currentKey);
            await redisClient.expire(currentKey, 7200); // 2-hour TTL
        } catch (e) {
            console.error(`Redis error incrementing demand:`, e);
        }

        return surgeMultiplier(totalDemand);
    }
    catch (error) {
        console.error('Error getting surge factor:', error);
        return 1.0; // Default to no surge if error occurs
    }
};

/**
 * Complete dynamic pricing function - simplified to rely on ML model
 */
const getDynamicPrice = async (pickup, dropoff, dateTime = new Date(), passengerCount = 1) => {
    try {
        console.log('getDynamicPrice called with:', { pickup, dropoff, dateTime, passengerCount });

        const distance = calculateDistance(pickup, dropoff);
        const duration = estimateRideDuration(distance);

        const baseFare = BASE_FARE;
        const distanceFare = distance * COST_PER_KM;
        const timeFare = duration * COST_PER_MINUTE;
        const basicFare = baseFare + distanceFare + timeFare;

        let mlPrediction;
        try {
            mlPrediction = await getPredictedFare(pickup, dropoff, dateTime, passengerCount);
        } catch (mlError) {
            console.log('ML model error, falling back to basic fare');
            mlPrediction = {
                predicted_fare: basicFare,
                distance_km: distance
            };
        }

        let surgeFactor = await getSurgeFactor(dropoff, dateTime);
        mlPrediction.predicted_fare *= surgeFactor;

        const result = {
            fare: Math.round(mlPrediction.predicted_fare * 100) / 100,
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

        return result;
    } catch (error) {
        console.error('Error in dynamic pricing:', error);

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