// src/services/customerService.js
import api from './api';

export const customerService = {
  // Get customer profile
  getProfile: async (customerId) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },
  
  // Update customer profile
  updateProfile: async (customerId, data) => {
    const response = await api.patch(`/customers/${customerId}`, data);
    return response.data;
  },
  
  // Get customer ride history
  getRideHistory: async (customerId) => {
    const response = await api.get(`/rides/customer/${customerId}`);
    return response.data;
  },
  
  // Book a new ride
  bookRide: async (rideData) => {
    const response = await api.post('/rides', rideData);
    return response.data;
  },
  
  // Get fare estimate
  getFareEstimate: async (rideData) => {
    const response = await api.post('/pricing/estimate', rideData);
    return response.data;
  },
  
  // Get nearby drivers
  getNearbyDrivers: async (latitude, longitude) => {
    const response = await api.get(`/rides/nearby-drivers?latitude=${latitude}&longitude=${longitude}`);
    return response.data;
  },
  
  // Rate a ride
  rateRide: async (rideId, rating, comment) => {
    const response = await api.post(`/rides/${rideId}/rate`, { rating, comment });
    return response.data;
  }
};