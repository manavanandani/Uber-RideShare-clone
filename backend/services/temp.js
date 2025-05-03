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
        
        const response = await axios.post(process.env.ML_API_URL || 'http://localhost:8000/predict', {
            pickup_datetime: timestamp,
            passenger_count: passengerCount,
            pickup_longitude: pickup.longitude,
            pickup_latitude: pickup.latitude,
            dropoff_longitude: dropoff.longitude,
            dropoff_latitude: dropoff.latitude
        });
        
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
        // Try to get from cache first
        const cacheKey = `price:${pickup.latitude.toFixed(4)}:${pickup.longitude.toFixed(4)}:${dropoff.latitude.toFixed(4)}:${dropoff.longitude.toFixed(4)}:${passengerCount}:${dateTime.getHours()}`;
        const cachedPrice = await redisClient.get(cacheKey);
        
        if (cachedPrice) {
            return JSON.parse(cachedPrice);
        }
        
        // Get ML prediction with surge factors included
        const prediction = await getPredictedFare(pickup, dropoff, dateTime, passengerCount);
        
        // Calculate distance and duration for reference
        const distance = prediction.distance_km || calculateDistance(pickup, dropoff);
        const duration = estimateRideDuration(distance);
        
        // Build a reference breakdown for transparency
        const baseFare = BASE_FARE;
        const distanceFare = distance * COST_PER_KM;
        const timeFare = duration * COST_PER_MINUTE;
        
        // Calculate implied surge factor
        const rawFare = baseFare + distanceFare + timeFare;
        const surgeFactor = prediction.surge_factor || (prediction.predicted_fare / rawFare);
        
        // Bundle all the information together
        const result = {
            fare: prediction.predicted_fare,
            distance: distance,
            duration: duration,
            usedMlModel: prediction.status === 'success',
            surge_factor: surgeFactor,
            breakdown: {
                base_fare: baseFare,
                distance_fare: distanceFare,
                time_fare: timeFare,
                surge_multiplier: surgeFactor
            }
        };
        
        // Cache for 3 minutes
        await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 180);
        
        return result;
    } catch (error) {
        console.error('Error in dynamic pricing:', error);
        throw error;
    }
};

module.exports = {
    calculateDistance,
    estimateRideDuration,
    getPredictedFare,
    getDynamicPrice
};