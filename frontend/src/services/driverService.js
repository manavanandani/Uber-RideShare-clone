// src/services/driverService.js (update with any missing methods)
import api from './api';

export const driverService = {
  // Profile management
  getProfile: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  },
  
  updateProfile: async (driverId, data) => {
    const response = await api.put(`/drivers/${driverId}`, data);
    return response.data;
  },
  
  // Status management
  updateStatus: async (driverId, status, location = null) => {
    const data = { status };
    if (location) {
      data.latitude = location.latitude;
      data.longitude = location.longitude;
    }
    const response = await api.patch(`/drivers/${driverId}/status`, data);
    return response.data;
  },
  
  // Ride management
  getRideHistory: async (driverId) => {
    const response = await api.get(`/rides/driver/${driverId}`);
    return response.data;
  },
  
  getAvailableRides: async () => {
    const response = await api.get('/rides?status=requested');
    return response.data;
  },
  
  acceptRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/accept`);
    return response.data;
  },
  
  startRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/start`);
    return response.data;
  },
  
  completeRide: async (rideId) => {
    const response = await api.patch(`/rides/${rideId}/complete`);
    return response.data;
  },
  
  rateCustomer: async (rideId, rating, comment = '') => {
    const response = await api.post(`/rides/${rideId}/rate-customer`, { rating, comment });
    return response.data;
  },
  
  // Media upload
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
  
  // Reviews
  getReviews: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}/reviews`);
    return response.data;
  },
  
  // Create billing for a completed ride
  createBill: async (rideId) => {
    const response = await api.post('/billing', { ride_id: rideId });
    return response.data;
  }
};