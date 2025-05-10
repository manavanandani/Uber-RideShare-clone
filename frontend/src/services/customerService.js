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

  // Update in customerService.js
getActiveRide: async (customerId) => {
  try {
    const response = await api.get(`/rides/customer/${customerId}/active`);
    return response.data;
  } catch (err) {
    // If it's a 404, it means no active ride, so return null data
    if (err.response?.status === 404) {
      return { data: null };
    }
    // Rethrow for other errors
    throw err;
  }
},
  
  // Rate a ride
  rateRide: async (rideId, rating, comment) => {
    const response = await api.post(`/rides/${rideId}/rate`, { rating, comment });
    return response.data;
  },

  cancelRide: async (rideId, reason = '') => {
    const response = await api.patch(`/rides/${rideId}/cancel-customer`, { reason });
    return response.data;
  },

  deleteProfile: async (customerId) => {
  try {
    console.log(`Attempting to delete customer profile: ${customerId}`);
    const response = await api.delete(`/customers/delete/${customerId}`);
    console.log('Customer deletion response:', response);
    return response.data;
  } catch (error) {
    console.error('Customer deletion error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}
};