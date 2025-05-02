// diagnostics.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';

// Helper functions
const generateSSN = () => {
  // First part: 3 digits
  const part1 = String(Math.floor(Math.random() * 900) + 100);
  // Second part: 2 digits
  const part2 = String(Math.floor(Math.random() * 90) + 10);
  // Third part: 4 digits
  const part3 = String(Math.floor(Math.random() * 9000) + 1000);
  
  // Format: XXX-XX-XXXX
  return `${part1}-${part2}-${part3}`;
};

// Create admin if needed
const createAdmin = async () => {
  try {
    console.log('Creating admin account...');
    
    const adminData = {
      admin_id: generateSSN(),
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      password: 'password123',
      phone: '555-123-4567',
      address: '123 Admin St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105'
    };
    
    await axios.post(`${API_URL}/admin`, adminData);
    console.log('Admin account created successfully');
    return true;
  } catch (error) {
    // If we get a 400 error with "already exists", that's actually fine
    if (error.response && error.response.status === 400 && 
        error.response.data.message && 
        error.response.data.message.includes('already exists')) {
      console.log('Admin account already exists, proceeding to login');
      return true;
    }
    
    console.error('Error creating admin account:', error.response?.data?.message || error.message);
    return false;
  }
};

// Authentication
const login = async () => {
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
    console.error('Login failed:', error.response?.data?.message || error.message);
    
    // Try to create the admin account and then login again
    if (await createAdmin()) {
      return login(); // Try logging in again after creating admin
    }
    
    return false;
  }
};

// Diagnostic version of the generateRides function
const generateTestRides = async (count, drivers, customers) => {
  console.log(`Generating ${count} test rides...`);
  
  // Create a single test ride to diagnose issues
  const ride = {
    ride_id: generateSSN(),
    pickup_location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    dropoff_location: {
      latitude: 37.7849,
      longitude: -122.4294
    },
    date_time: new Date().toISOString(),
    customer_id: customers[0].customer_id,
    driver_id: drivers[0].driver_id,
    fare_amount: 15.75,
    passenger_count: 1,
    status: 'completed',
    distance: 2.5,
    duration: 15
  };
  
  console.log('Test ride object:', JSON.stringify(ride, null, 2));
  return [ride];
};

// Diagnostic version of the generateBills function
const generateTestBill = async (ride) => {
  console.log(`Generating test bill for ride ${ride.ride_id}...`);
  
  const bill = {
    bill_id: generateSSN(),
    date: new Date().toISOString(),
    pickup_time: ride.date_time,
    dropoff_time: new Date(new Date(ride.date_time).getTime() + ride.duration * 60000).toISOString(),
    distance_covered: ride.distance,
    total_amount: ride.fare_amount,
    source_location: `${ride.pickup_location.latitude},${ride.pickup_location.longitude}`,
    destination_location: `${ride.dropoff_location.latitude},${ride.dropoff_location.longitude}`,
    driver_id: ride.driver_id,
    customer_id: ride.customer_id,
    payment_status: 'completed',
    payment_method: 'credit_card',
    ride_id: ride.ride_id,
    breakdown: {
      base_fare: 3.0,
      distance_fare: ride.distance * 1.5,
      time_fare: ride.duration * 0.2,
      surge_multiplier: 1.0
    }
  };
  
  console.log('Test bill object:', JSON.stringify(bill, null, 2));
  return [bill];
};

// Verbose version of the bulkInsert function
const bulkInsertVerbose = async (endpoint, data, batchSize = 1) => {
  console.log(`Attempting to insert ${data.length} records to ${endpoint}...`);
  console.log(`Full endpoint URL: ${API_URL}/${endpoint}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  console.log('Using headers:', headers);
  
  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}, size: ${batch.length}`);
    
    // First try a regular (non-bulk) insert for the first item
    try {
      console.log(`Attempting regular insert to ${endpoint}...`);
      const singleResponse = await axios.post(
        `${API_URL}/${endpoint}`, 
        batch[0], 
        { headers }
      );
      console.log(`Regular insert result:`, singleResponse.status, singleResponse.data);
    } catch (error) {
      console.error(`Error with regular insert:`, error.response?.data?.message || error.message);
      console.log('Request that failed:', JSON.stringify(batch[0], null, 2));
    }
    
    // Then try bulk insert
    try {
      console.log(`Attempting bulk insert to ${endpoint}...`);
      const bulkData = {
        bulk: true,
        items: batch
      };
      console.log('Bulk request data:', JSON.stringify(bulkData, null, 2));
      
      const response = await axios.post(
        `${API_URL}/${endpoint}`, 
        bulkData, 
        { headers }
      );
      
      console.log(`Bulk insert result:`, response.status, response.data);
    } catch (error) {
      console.error(`Error with bulk insert:`, error.response?.data?.message || error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
};

// Updated main function for diagnosis
const diagnoseIssue = async () => {
  try {
    // Login to get admin token
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Failed to login or create admin account. Exiting.');
      return;
    }
    
    // Get existing drivers and customers to use for test rides
    console.log('Fetching existing drivers...');
    let drivers = [];
    try {
      const driversResponse = await axios.get(`${API_URL}/drivers`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      drivers = driversResponse.data.data || [];
      console.log(`Found ${drivers.length} drivers`);
    } catch (error) {
      console.error('Error fetching drivers:', error.response?.data?.message || error.message);
    }
    
    console.log('Fetching existing customers...');
    let customers = [];
    try {
      const customersResponse = await axios.get(`${API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      customers = customersResponse.data.data || [];
      console.log(`Found ${customers.length} customers`);
    } catch (error) {
      console.error('Error fetching customers:', error.response?.data?.message || error.message);
    }
    
    if (drivers.length === 0 || customers.length === 0) {
      console.error('Need at least one driver and one customer for testing.');
      return;
    }
    
    // Generate test ride
    const testRides = await generateTestRides(1, drivers, customers);
    
    // Try inserting the test ride
    await bulkInsertVerbose('rides', testRides);
    
    // Generate test bill
    const testBills = await generateTestBill(testRides[0]);
    
    // Try inserting the test bill
    await bulkInsertVerbose('billing', testBills);
    
    console.log('Diagnostic test complete. Check the logs above for errors.');
  } catch (error) {
    console.error('Error in diagnostic test:', error);
  }
};

// Run the diagnostic function
diagnoseIssue();