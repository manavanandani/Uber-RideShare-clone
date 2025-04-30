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
  
  // Update driver status
  updateStatus: async (driverId, status, location = null) => {
    const data = { status };
    if (location) {
      data.latitude = location.latitude;
      data.longitude = location.longitude;
    }
    const response = await api.patch(`/drivers/${driverId}/status`, data);
    return response.data;
  },
  
  // Get ride history
  getRideHistory: async (driverId) => {
    const response = await api.get(`/rides/driver/${driverId}`);
    return response.data;
  },
  
  // Accept a ride
  acceptRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/accept`);
    return response.data;
  },
  
  // Start a ride
  startRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/start`);
    return response.data;
  },
  
  // Complete a ride
  completeRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/complete`);
    return response.data;
  },
  
  // Rate a customer
  rateCustomer: async (rideId, rating, comment) => {
    const response = await api.post(`/rides/${rideId}/rate-customer`, { rating, comment });
    return response.data;
  },
  
  // Upload media
  uploadMedia: async (driverId, file) => {
    const formData = new FormData();
    formData.append('media', file);
    
    const response = await api.post(`/drivers/${driverId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Create bill
  createBill: async (rideId) => {
    const response = await api.post('/billing', { ride_id: rideId });
    return response.data;
  }
};