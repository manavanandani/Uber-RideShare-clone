import api from './api';

export const billingService = {
  // Get billing for a specific ride by using customer bills and filtering
  getRideBilling: async (customerId, rideId) => {
    try {
      const response = await api.get(`/billing/customer/${customerId}`);
      if (response && response.data && response.data.data) {
        // Find the bill that matches the ride ID
        const bill = response.data.data.find(bill => bill.ride_id === rideId);
        return bill ? { data: bill } : null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching billing information:', error);
      return null;
    }
  },
  
  // Add other billing-related methods as needed
  processPayment: async (billingId, paymentDetails) => {
    try {
      const response = await api.post(`/billings/${billingId}/process`, paymentDetails);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
};