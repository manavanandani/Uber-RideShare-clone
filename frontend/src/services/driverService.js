// src/services/driverService.js
import api from './api';

export const driverService = {
  // Get driver profile
  getProfile: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  },
  
  // Update driver profile
  updateProfile: async (driverId, data) => {
    const response = await api.put(`/drivers/${driverId}`, data);
    return response.data;
  },
  
  // Update driver status (available, busy, offline)
  updateStatus: async (driverId, status, coordinates = null) => {
    const data = { status };
    
    // Add coordinates if available
    if (coordinates) {
      data.latitude = coordinates.latitude;
      data.longitude = coordinates.longitude;
    }
    
    const response = await api.patch(`/drivers/${driverId}/status`, data);
    return response.data;
  },
  
  // Get available ride requests
  getAvailableRides: async (latitude, longitude) => {
    const response = await api.get(`/rides/nearby?latitude=${latitude}&longitude=${longitude}`);
    return response.data;
  },
 
  
  // Accept a ride
  acceptRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/accept`);
    return response.data;
  },
  
  // Start ride (after picking up passenger)
  startRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/start`);
    return response.data;
  },
  
  // Complete ride
  completeRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/complete`);
    return response.data;
  },
  
  // Get driver's ride history
  getRideHistory: async (driverId) => {
    const response = await api.get(`/rides/driver/${driverId}`);
    return response.data;
  },
  
  // Get driver's earnings
  getEarnings: async (driverId, period = 'week') => {
    const response = await api.get(`/billing/driver/${driverId}?period=${period}`);
    return response.data;
  },
  
  // Rate a customer after ride
  rateCustomer: async (rideId, rating, comment) => {
    const response = await api.post(`/rides/${rideId}/rate-customer`, { rating, comment });
    return response.data;
  },
  
  // Upload driver profile photo or vehicle images
  uploadMedia: async (driverId, formData) => {
    const response = await api.post(`/drivers/${driverId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};