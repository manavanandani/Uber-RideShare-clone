// src/services/adminService.js
import api from './api';

export const adminService = {
  // Get admin profile
  getProfile: async (adminId) => {
    const response = await api.get(`/admin/${adminId}`);
    return response.data;
  },
  
  // Update admin profile
  updateProfile: async (adminId, data) => {
    const response = await api.put(`/admin/${adminId}`, data);
    return response.data;
  },
  
  // Get system statistics
  getSystemStats: async () => {
    const response = await api.get('/admin/stats/summary');
    return response.data;
  },
  
  // Get all drivers
  getAllDrivers: async () => {
    const response = await api.get('/drivers');
    return response.data;
  },
  
  // Get driver by ID
  getDriverById: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  },
  
  // Create a new driver
  createDriver: async (driverData) => {
    const response = await api.post('/drivers', driverData);
    return response.data;
  },
  
  // Update driver
  updateDriver: async (driverId, data) => {
    const response = await api.put(`/drivers/${driverId}`, data);
    return response.data;
  },
  
  // Delete driver
  deleteDriver: async (driverId) => {
    const response = await api.delete(`/drivers/${driverId}`);
    return response.data;
  },
  
  // Review driver account
  reviewDriverAccount: async (driverId, status, notes) => {
    const response = await api.post(`/admin/drivers/${driverId}/review`, { status, notes });
    return response.data;
  },
  
  // Get all customers
  getAllCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  
  // Get customer by ID
  getCustomerById: async (customerId) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },
  
  // Create a new customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },
  
  // Update customer
  updateCustomer: async (customerId, data) => {
    const response = await api.patch(`/customers/${customerId}`, data);
    return response.data;
  },
  
  // Delete customer
  deleteCustomer: async (customerId) => {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  },
  
  // Review customer account
  reviewCustomerAccount: async (customerId, status, notes) => {
    const response = await api.post(`/admin/customers/${customerId}/review`, { status, notes });
    return response.data;
  },
  
  // Get all rides
  getAllRides: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/rides/admin/all?${queryString}`);
    return response.data;
  },
  
  // Get ride by ID
  getRideById: async (rideId) => {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },
  
  // Get all billings
  getAllBillings: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/billing/search?${queryString}`);
    return response.data;
  },
  
  // Get billing by ID
  getBillingById: async (billId) => {
    const response = await api.get(`/billing/${billId}`);
    return response.data;
  },
  
  // Get statistics
  getRevenueStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/stats/revenue?${params.toString()}`);
    return response.data;
  },
  
  getRidesByAreaStats: async () => {
    const response = await api.get('/stats/rides-by-area');
    return response.data;
  },
  
  getGraphData: async (type) => {
    const response = await api.get(`/stats/graph-data?type=${type}`);
    return response.data;
  },
  
  getPerformanceComparison: async () => {
    const response = await api.get('/stats/performance-comparison');
    return response.data;
  }
};

export default adminService;