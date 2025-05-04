const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';
let CUSTOMER_TOKEN = '';

// Authentication
const loginAsAdmin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/admin/login`, {
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    
    ADMIN_TOKEN = response.data.token;
    console.log('Admin logged in successfully');
    return true;
  } catch (error) {
    console.error('Admin login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Login as customer
const loginAsCustomer = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/customer/login`, {
      email: 'test_customer@test.com',
      password: 'password123',
      role: 'customer'
    });
    
    CUSTOMER_TOKEN = response.data.token;
    console.log('Customer logged in successfully');
    return true;
  } catch (error) {
    console.error('Customer login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const updateBillsToCompleted = async () => {
  console.log('Updating all pending bills to completed status...');
  
  try {
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    const customerHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CUSTOMER_TOKEN}`
    };
    
    // Step 1: Get all pending bills
    console.log('Fetching pending bills...');
    const searchResponse = await axios.get(`${API_URL}/billing/search`, {
      params: { payment_status: 'pending' },
      headers: adminHeaders
    });
    
    const pendingBills = searchResponse.data.data || [];
    console.log(`Found ${pendingBills.length} pending bills`);
    
    // Step 2: Update each bill
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const bill of pendingBills) {
      try {
        // Add debugging: First check if bill exists
        console.log(`Processing bill ${bill.bill_id}`);
        
        try {
          const checkBill = await axios.get(`${API_URL}/billing/${bill.bill_id}`, {
            headers: adminHeaders
          });
          console.log(`Bill ${bill.bill_id} exists with status: ${checkBill.data.data.payment_status}`);
        } catch (checkError) {
          console.error(`Error checking bill ${bill.bill_id}:`, checkError.response?.status, checkError.response?.data);
          console.log('Skipping this bill');
          failedCount++;
          continue;
        }
        
        // Then process payment
        const response = await axios.post(`${API_URL}/billing/${bill.bill_id}/pay`, {
          payment_method: 'credit_card'
        }, {
          headers: customerHeaders // Use customer token for payment
        });
        
        console.log(`Successfully updated bill ${bill.bill_id} status to completed`);
        updatedCount++;
        
        // Log progress for large batches
        if (pendingBills.length > 100 && updatedCount % 50 === 0) {
          console.log(`Processed ${updatedCount}/${pendingBills.length} bills`);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error updating bill ${bill.bill_id}:`, error.response?.status);
        console.error(`Error details:`, error.response?.data);
        
        // Add a delay if we're getting rate limited
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Add a small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Successfully updated ${updatedCount} bills to completed status`);
    console.log(`Failed to update ${failedCount} bills`);
    
  } catch (error) {
    console.error('Error in bill update process:', error.message);
    
    // Additional debugging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Main function to run the script
const main = async () => {
  // Login as admin and customer
  await loginAsAdmin();
  await loginAsCustomer();
  
  // Update bills
  await updateBillsToCompleted();
  
  console.log('Script completed.');
};

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});