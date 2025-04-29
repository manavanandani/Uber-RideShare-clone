// src/services/statsService.js
import api from './api';

export const statsService = {
  // Get revenue statistics
  getRevenueStats: async (period = 'month') => {
    const response = await api.get(`/stats/revenue?period=${period}`);
    return response.data;
  },
  
  // Get ride statistics by area
  getRidesByArea: async () => {
    const response = await api.get('/stats/rides-by-area');
    return response.data;
  },
  
  // Get graph data
  getGraphData: async (type) => {
    const response = await api.get(`/stats/graph-data?type=${type}`);
    return response.data;
  },
  
  // Get performance comparison data
  getPerformanceComparison: async () => {
    const response = await api.get('/stats/performance-comparison');
    return response.data;
  },
  
  // Get system health data
  getSystemHealth: async () => {
    const response = await api.get('/stats/health');
    return response.data;
  }
};