// services/pricingService.js already exists but let's ensure it's fully implemented
const axios = require('axios');
const haversine = require('haversine');
const { redisClient } = require('../config/redis');

// Dynamic pricing factors
const SURGE_MULTIPLIER_MAX = 3.0; // Maximum surge multiplier
const BASE_FARE = 3.0;            // Base fare in USD
const COST_PER_KM = 1.5;          // Cost per kilometer in USD
const COST_PER_MINUTE = 0.2;      // Cost per minute in USD
const WAITING_TIME_COST = 0.1;    // Cost per minute of waiting in USD

/**
 * Determine if current time is peak hour
 * @returns {boolean} True if current time is peak hour
 */
const isPeakHour = (dateTime = new Date()) => {
  const hour = dateTime.getHours();
  const day = dateTime.getDay();
  
  // Morning peak: 7-9 AM on weekdays
  const isMorningPeak = (hour >= 7 && hour <= 9) && (day >= 1 && day <= 5);
  
  // Evening peak: 5-7 PM on weekdays
  const isEveningPeak = (hour >= 17 && hour <= 19) && (day >= 1 && day <= 5);
  
  // Late night weekend peak: 11PM-3AM on Friday and Saturday
  const isLateNightWeekend = (hour >= 23 || hour <= 3) && (day === 5 || day === 6);
  
  return isMorningPeak || isEveningPeak || isLateNightWeekend;
};

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
 * Get current demand factor for a specific area
 */
const getDemandFactor = async (location) => {
  try {
    // Try to get from Redis cache first
    const cacheKey = `demand_factor:${Math.round(location.latitude * 100) / 100}:${Math.round(location.longitude * 100) / 100}`;
    const cachedFactor = await redisClient.get(cacheKey);
    
    if (cachedFactor) {
      return parseFloat(cachedFactor);
    }
    
    // If not in cache, calculate (in real system this would come from analytics)
    // For demo, generate a random value between 1.0 and SURGE_MULTIPLIER_MAX
    const demandFactor = Math.random() * (SURGE_MULTIPLIER_MAX - 1.0) + 1.0;
    
    // Cache for 5 minutes
    await redisClient.set(cacheKey, demandFactor.toString(), 'EX', 300);
    
    return demandFactor;
  } catch (error) {
    console.error('Error getting demand factor:', error);
    return 1.0; // Default to 1.0 (no surge) if there's an error
  }
};

/**
 * Calculate fare estimate based on ride details
 */
const calculateFareEstimate = async (pickup, dropoff, dateTime = new Date(), passengerCount = 1) => {
  try {
    // Step 1: Calculate distance
    const distanceKm = calculateDistance(pickup, dropoff);
    
    // Step 2: Estimate ride duration
    const estimatedDurationMinutes = estimateRideDuration(distanceKm);
    
    // Step 3: Get demand factor
    const demandFactor = await getDemandFactor(pickup);
    
    // Step 4: Apply peak hour factor
    const peakMultiplier = isPeakHour(dateTime) ? 1.25 : 1.0;
    
    // Step 5: Calculate costs
    const baseFare = BASE_FARE;
    const distanceFare = distanceKm * COST_PER_KM;
    const timeFare = estimatedDurationMinutes * COST_PER_MINUTE;
    
    // Step 6: Apply passenger count adjustment (small discount for multiple passengers)
    const passengerFactor = passengerCount > 1 ? (1 + (passengerCount - 1) * 0.05) : 1.0;
    
    // Step 7: Calculate final fare
    let fareEstimate = (baseFare + distanceFare + timeFare) * peakMultiplier * demandFactor * passengerFactor;
    
    // Step 8: Round to nearest 0.5
    fareEstimate = Math.round(fareEstimate * 2) / 2;
    
    return {
      fareEstimate,
      distance: distanceKm,
      duration: estimatedDurationMinutes,
      baseFare,
      distanceFare,
      timeFare,
      demandFactor,
      peakMultiplier,
      passengerFactor
    };
  } catch (error) {
    console.error('Error calculating fare estimate:', error);
    throw error;
  }
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
    
    // Fallback to our basic algorithm if ML service is unavailable
    const estimate = await calculateFareEstimate(pickup, dropoff, new Date(dateTime), passengerCount);
    return {
      status: 'fallback',
      predicted_fare: estimate.fareEstimate,
      distance_km: estimate.distance
    };
  }
};

/**
 * Complete dynamic pricing function
 */
const getDynamicPrice = async (pickup, dropoff, dateTime = new Date(), passengerCount = 1) => {
  try {
    // Try to get from cache first
    const cacheKey = `price:${pickup.latitude.toFixed(4)}:${pickup.longitude.toFixed(4)}:${dropoff.latitude.toFixed(4)}:${dropoff.longitude.toFixed(4)}:${passengerCount}:${dateTime.getHours()}`;
    const cachedPrice = await redisClient.get(cacheKey);
    
    if (cachedPrice) {
      return JSON.parse(cachedPrice);
    }
    
    // Try to get ML prediction first
    const prediction = await getPredictedFare(pickup, dropoff, dateTime, passengerCount);
    
    // Calculate our own estimate as a fallback/comparison
    const estimate = await calculateFareEstimate(pickup, dropoff, new Date(dateTime), passengerCount);
    
    // Use ML prediction if available, otherwise use our estimate
    const finalFare = prediction.status === 'success' ? prediction.predicted_fare : estimate.fareEstimate;
    
    // Bundle all the information together
    const result = {
      fare: finalFare,
      distance: prediction.distance_km || estimate.distance,
      duration: estimate.duration,
      baseFare: estimate.baseFare,
      demandSurge: estimate.demandFactor,
      peakHourSurge: estimate.peakMultiplier,
      usedMlModel: prediction.status === 'success',
      breakdown: {
        base_fare: estimate.baseFare,
        distance_fare: estimate.distanceFare,
        time_fare: estimate.timeFare,
        surge_multiplier: estimate.demandFactor * (isPeakHour(dateTime) ? 1.25 : 1.0)
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
  isPeakHour,
  calculateFareEstimate,
  getPredictedFare,
  getDynamicPrice
};