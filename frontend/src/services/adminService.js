// src/services/adminService.js
import api from './api';

export const adminService = {
  // Driver management
  getAllDrivers: async () => {
    const response = await api.get('/drivers');
    return response.data;
  },
  
  reviewDriverAccount: async (driverId, status, notes) => {
    const response = await api.post(`/admin/drivers/${driverId}/review`, { status, notes });
    return response.data;
  },
  
  // Customer management
  getAllCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  
  reviewCustomerAccount: async (customerId, status, notes) => {
    const response = await api.post(`/admin/customers/${customerId}/review`, { status, notes });
    return response.data;
  },
  
  // Billing management
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
  
  // System stats
  getSystemSummary: async () => {
    const response = await api.get('/admin/stats/summary');
    return response.data;
  }
};