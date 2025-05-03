// src/services/adminService.js
import api from './api';

export const adminService = {
  // Dashboard stats
  getSystemStats: async () => {
    const response = await api.get('/admin/stats/summary');
    return response.data;
  },
  
  // Drivers
  getAllDrivers: async () => {
    const response = await api.get('/drivers');
    return response.data;
  },
  
  getDriverById: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  },
  
  createDriver: async (driverData) => {
    const response = await api.post('/drivers', driverData);
    return response.data;
  },
  
  updateDriver: async (driverId, driverData) => {
    const response = await api.put(`/drivers/${driverId}`, driverData);
    return response.data;
  },
  
  deleteDriver: async (driverId) => {
    const response = await api.delete(`/drivers/${driverId}`);
    return response.data;
  },
  
  reviewDriverAccount: async (driverId, status, notes) => {
    const response = await api.post(`/admin/drivers/${driverId}/review`, { status, notes });
    return response.data;
  },
  
  // Customers
  getAllCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  
  getCustomerById: async (customerId) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },
  
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },
  
  updateCustomer: async (customerId, customerData) => {
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data;
  },
  
  deleteCustomer: async (customerId) => {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  },
  
  reviewCustomerAccount: async (customerId, status, notes) => {
    const response = await api.post(`/admin/customers/${customerId}/review`, { status, notes });
    return response.data;
  },
  
  // Analytics
  getRevenueStats: async (startDate, endDate) => {
    const response = await api.get(`/stats/revenue?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
  
  getRidesByArea: async () => {
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
  },
  
  getSystemHealth: async () => {
    const response = await api.get('/stats/health');
    return response.data;
  }
};

export default adminService;