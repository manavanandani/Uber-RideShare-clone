// src/services/adminService.js
import api from './api';

export const adminService = {
  // Get all drivers
  getAllDrivers: async () => {
    const response = await api.get('/drivers');
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
  
  // Review customer account
  reviewCustomerAccount: async (customerId, status, notes) => {
    const response = await api.post(`/admin/customers/${customerId}/review`, { status, notes });
    return response.data;
  },
  
  // Search bills
  searchBills: async (filters) => {
    // Construct query params
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        if (key === 'start_date' || key === 'end_date') {
          if (value instanceof Date && !isNaN(value)) {
            queryParams.append(key, value.toISOString());
          }
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const response = await api.get(`/billing/search?${queryParams.toString()}`);
    return response.data;
  },
  
  // Get system stats
  getSystemStats: async () => {
    const response = await api.get('/admin/stats/summary');
    return response.data;
  },
  
  // Create driver
  createDriver: async (driverData) => {
    const response = await api.post('/drivers', driverData);
    return response.data;
  },
  
  // Create customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  }
};