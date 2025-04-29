// src/services/customerService.js (update with any missing methods)
import api from './api';

export const customerService = {
  // Get customer dashboard data
  getDashboard: async () => {
    // In a real implementation, you might have a dedicated endpoint
    // For now, we'll simulate by fetching multiple resources
    const profileRes = await api.get(`/customers/me`);
    const ridesRes = await api.get(`/rides/customer/${profileRes.data.data.customer_id}`);
    
    return {
      data: {
        profile: profileRes.data.data,
        rides: ridesRes.data.data
      }
    };
  },
  
  // Get customer profile
  getProfile: async (customerId) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },
  
  // Update customer profile
  updateProfile: async (customerId, data) => {
    const response = await api.put(`/customers/${customerId}`, data);
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
  },
  
  // Upload ride images
  uploadRideImages: async (customerId, rideId, images) => {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    const response = await api.post(`/customers/${customerId}/rides/${rideId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Update location
  updateLocation: async (customerId, latitude, longitude) => {
    const response = await api.patch(`/customers/${customerId}/location`, {
      latitude,
      longitude
    });
    return response.data;
  }
};