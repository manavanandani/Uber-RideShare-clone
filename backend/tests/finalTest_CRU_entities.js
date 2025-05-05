// enhancedTestDataGenerator.js - Comprehensive Performance Testing
// - Tests Driver, Customer, Ride, and Billing entities
// - Tests across 4 configurations: B, BM, BS, BMSK
// - Generates performance metrics for CREATE, READ, UPDATE operations

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';
let TEST_CUSTOMER_TOKEN = '';
let TEST_DRIVER_TOKEN = '';
let TEST_CUSTOMER_ID = '';
let TEST_DRIVER_ID = '';

// Counters for unique ID generation
let driverCounter = 0;
let customerCounter = 0;
let adminCounter = 0;
let rideCounter = 0;
let billingCounter = 0;

// Helper functions
const generateSSN = (type = 'admin') => {
  let counter;
  if (type === 'driver') {
    counter = driverCounter++;
  } else if (type === 'customer') {
    counter = customerCounter++;
  } else if (type === 'billing') {
    counter = billingCounter++;
  } else if (type === 'ride') {
    counter = rideCounter++;
  } else {
    counter = adminCounter++;
  }
  const part1 = String(100 + (counter % 900)).padStart(3, '0');
  const part2 = String(10 + (Math.floor(counter / 900) % 90)).padStart(2, '0');
  const part3 = String(1000 + (Math.floor(counter / 81000) % 9000)).padStart(4, '0');
  return `${part1}-${part2}-${part3}`;
};

const generateRideId = () => {
  return generateSSN('ride');
};

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
    console.error('Login failed:', error.response?.data?.message || error.message);
    
    // Try to create the admin account and then login again
    if (await createAdmin()) {
      return loginAsAdmin(); // Retry login
    }
    
    return false;
  }
};

// Create admin if needed
const createAdmin = async () => {
  try {
    console.log('Creating admin account...');
    
    const adminData = {
      admin_id: generateSSN('admin'),
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
    if (error.response?.status === 400 && 
        error.response.data.message && 
        error.response.data.message.includes('already exists')) {
      console.log('Admin account already exists. Proceeding to login...');
      return true;
    }
    
    console.error('Error creating admin:', error.response?.data?.message || error.message);
    return false;
  }
};

// Create test accounts
const createTestAccounts = async () => {
  try {
    // Create a test customer
    const customerId = generateSSN('customer');
    TEST_CUSTOMER_ID = customerId;
    const customerEmail = 'test_customer@test.com';
    
    const customerData = {
      customer_id: customerId,
      first_name: 'Test',
      last_name: 'Customer',
      email: customerEmail,
      password: 'password123',
      phone: '555-1234567',
      address: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      credit_card: {
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123',
        name_on_card: 'Test Customer'
      },
      account_status: 'active'  // Ensure account is active
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    // Post customer
    try {
      await axios.post(`${API_URL}/customers`, customerData, { headers });
      console.log('Created test customer:', customerEmail);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('Test customer already exists, proceeding...');
      } else {
        throw error;
      }
    }
    
    // Login as customer
    const customerLoginResponse = await axios.post(`${API_URL}/auth/customer/login`, {
      email: customerEmail,
      password: 'password123',
      role: 'customer'
    });
    
    TEST_CUSTOMER_TOKEN = customerLoginResponse.data.token;
    console.log('Test customer logged in successfully');
    
    // Also create a test driver for ride testing
    const driverId = generateSSN('driver');
    TEST_DRIVER_ID = driverId;
    const driverEmail = 'test_driver@test.com';
    
    const driverData = {
      driver_id: driverId,
      first_name: 'Test',
      last_name: 'Driver',
      email: driverEmail,
      password: 'password123',
      phone: '555-7654321',
      address: '456 Test St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      car_details: 'Tesla Model 3 2022',
      status: 'available',
      account_status: 'approved'
    };
    
    // Post driver
    try {
      await axios.post(`${API_URL}/drivers`, driverData, { headers });
      console.log('Created test driver:', driverEmail);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('Test driver already exists, proceeding...');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating test accounts:', error.response?.data?.message || error.message);
    return false;
  }
};

// Generate drivers with retry logic
const generateDrivers = async (count, batchSize = 100) => {
  console.log(`Generating ${count} drivers...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const carMakers = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Mercedes', 'Audi', 'Tesla'];
  const carModels = ['Camry', 'Accord', 'Fusion', 'Malibu', 'Altima', 'Sonata', 'X5', 'E-Class', 'A4', 'Model 3'];
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i);
    const drivers = [];
    
    for (let j = 0; j < batchCount; j++) {
      const driver_id = generateSSN('driver');
      const first_name = `Driver${i + j}`;
      const last_name = `Test${Math.floor(Math.random() * 10000)}`;
      const email = `driver${i + j}@test.com`;
      
      // Generate random San Francisco area coordinates
      const location = {
        latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
        longitude: -122.4194 + (Math.random() * 0.1 - 0.05)
      };
      
      const driver = {
        driver_id,
        first_name,
        last_name,
        email,
        password: 'password123',
        phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        address: `${Math.floor(Math.random() * 10000)} Driver St`,
        city: 'San Francisco',
        state: states[Math.floor(Math.random() * states.length)],
        zip_code: String(Math.floor(Math.random() * 90000) + 10000),
        car_details: `${carMakers[Math.floor(Math.random() * carMakers.length)]} ${carModels[Math.floor(Math.random() * carModels.length)]} ${2015 + Math.floor(Math.random() * 10)}`,
        status: 'available',  // Set all drivers to available
        intro_media: {
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude] // MongoDB uses [longitude, latitude]
          }
        },
        account_status: 'approved'  // Make sure all drivers are approved
      };
      
      drivers.push(driver);
    }
    
    // Try to insert with retries
    let retries = 0;
    const maxRetries = 3;
    let success = false;
    
    while (!success && retries < maxRetries) {
      try {
        await axios.post(`${API_URL}/drivers`, { bulk: true, items: drivers }, { headers });
        console.log(`Successfully inserted drivers ${i + 1} to ${i + batchCount} of ${count}`);
        success = true;
      } catch (error) {
        retries++;
        console.error(`Error inserting drivers (Attempt ${retries}/${maxRetries}):`, error.message);
        
        if (retries < maxRetries) {
          console.log(`Retrying in ${retries * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retries * 2000));
        }
      }
    }
    
    if (!success) {
      console.error(`Failed to insert batch after ${maxRetries} attempts. Continuing with next batch.`);
    }
    
    // Add small delay between batches to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Completed generating ${count} drivers`);
  return true;
};

// Generate customers with retry logic
const generateCustomers = async (count, batchSize = 100) => {
  console.log(`Generating ${count} customers...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i);
    const customers = [];
    
    for (let j = 0; j < batchCount; j++) {
      const customer_id = generateSSN('customer');
      const first_name = `Customer${i + j}`;
      const last_name = `Test${Math.floor(Math.random() * 10000)}`;
      const email = `customer${i + j}@test.com`;
      
      // Generate random San Francisco area coordinates
      const location = {
        latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
        longitude: -122.4194 + (Math.random() * 0.1 - 0.05)
      };
      
      const customer = {
        customer_id,
        first_name,
        last_name,
        email,
        password: 'password123',
        phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        address: `${Math.floor(Math.random() * 10000)} Customer St`,
        city: 'San Francisco',
        state: states[Math.floor(Math.random() * states.length)],
        zip_code: String(Math.floor(Math.random() * 90000) + 10000),
        credit_card: {
          number: '4111111111111111',
          expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 5) + 25)}`,
          cvv: String(Math.floor(Math.random() * 900) + 100),
          name_on_card: `${first_name} ${last_name}`
        },
        last_location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude] // MongoDB uses [longitude, latitude]
        },
        account_status: 'active'  // Make sure all customers are active
      };
      
      customers.push(customer);
    }
    
    // Try to insert with retries
    let retries = 0;
    const maxRetries = 3;
    let success = false;
    
    while (!success && retries < maxRetries) {
      try {
        await axios.post(`${API_URL}/customers`, { bulk: true, items: customers }, { headers });
        console.log(`Successfully inserted customers ${i + 1} to ${i + batchCount} of ${count}`);
        success = true;
      } catch (error) {
        retries++;
        console.error(`Error inserting customers (Attempt ${retries}/${maxRetries}):`, error.message);
        
        if (retries < maxRetries) {
          console.log(`Retrying in ${retries * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retries * 2000));
        }
      }
    }
    
    if (!success) {
      console.error(`Failed to insert batch after ${maxRetries} attempts. Continuing with next batch.`);
    }
    
    // Add small delay between batches to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Completed generating ${count} customers`);
  return true;
};

// Updated createRidesAndBills function
const createRidesAndBills = async (count) => {
  console.log(`Creating ${count} test rides and bills...`);
  
  // Get available customers and drivers
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  // Get customers
  let customers = [];
  try {
    const customerResponse = await axios.get(`${API_URL}/customers`, { 
      headers: adminHeaders
    });
    customers = customerResponse.data.data || [];
    console.log(`Retrieved ${customers.length} customers for ride generation`);
    
    // If not enough customers were found, add our test customer
    if (!customers.find(c => c.customer_id === TEST_CUSTOMER_ID)) {
      customers.push({ customer_id: TEST_CUSTOMER_ID });
    }
  } catch (error) {
    console.error('Error retrieving customers:', error.message);
    // Fallback to test customer
    customers = [{ customer_id: TEST_CUSTOMER_ID }];
  }
  
  // Get available drivers from database
  let drivers = [];
  try {
    // Get drivers with 'available' status
    const driverResponse = await axios.get(`${API_URL}/drivers/available`, { 
      headers: adminHeaders
    });
    drivers = driverResponse.data.data || [];
    console.log(`Retrieved ${drivers.length} available drivers for ride generation`);
    
    // If not enough drivers were found, get all drivers
    if (drivers.length < 10) {
      console.log('Not enough available drivers, fetching all drivers...');
      const allDriversResponse = await axios.get(`${API_URL}/drivers`, { 
        headers: adminHeaders
      });
      drivers = allDriversResponse.data.data || [];
      console.log(`Retrieved ${drivers.length} total drivers`);
    }
    
    // Use a subset of drivers if there are too many (for better performance)
    if (drivers.length > 100) {
      drivers = drivers.slice(0, 100);
      console.log(`Using a subset of 100 drivers for testing`);
    }
    
    // Make sure we have at least one driver
    if (drivers.length === 0) {
      console.log('No drivers found, using test driver as fallback');
      drivers = [{ driver_id: TEST_DRIVER_ID }];
    }
  } catch (error) {
    console.error('Error retrieving drivers:', error.message);
    // Fallback to test driver
    drivers = [{ driver_id: TEST_DRIVER_ID }];
  }
  
  let successfulRides = 0;
  let failedRides = 0;
  let completedRides = [];
  
  // For tracking driver usage for statistics
  const driverUsage = {};
  
  for (let i = 0; i < count; i++) {
    try {
      // Select random customer and driver for variety
      const customerIndex = Math.floor(Math.random() * customers.length);
      const selectedCustomer = customers[customerIndex];
      
      const driverIndex = Math.floor(Math.random() * drivers.length);
      const selectedDriver = drivers[driverIndex];
      
      // Track driver usage for statistics
      if (!driverUsage[selectedDriver.driver_id]) {
        driverUsage[selectedDriver.driver_id] = 0;
      }
      driverUsage[selectedDriver.driver_id]++;
      
      // Random pickup/dropoff within San Francisco area (with some variety in distances)
      const distanceVariation = Math.random() < 0.2 ? 0.2 : 0.05; // 20% chance of longer ride
      
      const pickup = {
        latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
        longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
      };
      
      const dropoff = {
        latitude: pickup.latitude + (Math.random() * distanceVariation * 2 - distanceVariation),
        longitude: pickup.longitude + (Math.random() * distanceVariation * 2 - distanceVariation)
      };
      
      // Create a ride with random data using our test-create endpoint
      const rideData = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        date_time: new Date().toISOString(),
        passenger_count: Math.floor(Math.random() * 4) + 1,
        driver_id: selectedDriver.driver_id,
        customer_id: selectedCustomer.customer_id
      };
      
      // With retry logic
      let rideId = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!rideId && retryCount < maxRetries) {
        try {
          // Use the test-create endpoint with admin token
          const rideResponse = await axios.post(`${API_URL}/rides/test-create`, rideData, { headers: adminHeaders });
          rideId = rideResponse.data.data.ride_id;
          successfulRides++;
          
          if (i % 10 === 0) {
            console.log(`Created ride ${i+1}/${count} - ID: ${rideId} - Customer: ${selectedCustomer.customer_id} - Driver: ${selectedDriver.driver_id}`);
          }
        } catch (error) {
          retryCount++;
          console.error(`Attempt ${retryCount}/${maxRetries} failed for ride ${i+1}:`, error.response?.data?.message || error.message);
          
          if (retryCount >= maxRetries) {
            failedRides++;
            console.error(`Failed to create ride ${i+1} after ${maxRetries} attempts, skipping...`);
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
      
      if (!rideId) {
        continue; // Skip to next ride if this one failed
      }
      
      // Let's give a little breathing room between steps
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Accept ride using test endpoint
      try {
        await axios.patch(`${API_URL}/rides/test/${rideId}/accept`, { driver_id: selectedDriver.driver_id }, { headers: adminHeaders });
      } catch (error) {
        console.error(`Error accepting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue; // Skip to next ride if accept failed
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Start ride using test endpoint
      try {
        await axios.patch(`${API_URL}/rides/test/${rideId}/start`, {}, { headers: adminHeaders });
      } catch (error) {
        console.error(`Error starting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Complete ride using test endpoint
      try {
        await axios.patch(`${API_URL}/rides/test/${rideId}/complete`, {}, { headers: adminHeaders });
        // Add the ride ID to the list of completed rides
        completedRides.push(rideId);
      } catch (error) {
        console.error(`Error completing ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      // A longer delay between full ride cycles to avoid rate-limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Unexpected error in ride creation for ${i+1}/${count}:`, error.message);
    }
  }
  
  // Report on driver distribution
  console.log('\nDriver usage statistics:');
  const driverIds = Object.keys(driverUsage);
  console.log(`Used ${driverIds.length} different drivers`);
  
  // Sort drivers by usage
  const sortedDrivers = driverIds.sort((a, b) => driverUsage[b] - driverUsage[a]);
  console.log('Top 5 most used drivers:');
  for (let i = 0; i < Math.min(5, sortedDrivers.length); i++) {
    const driverId = sortedDrivers[i];
    console.log(`- Driver ${driverId}: ${driverUsage[driverId]} rides (${(driverUsage[driverId] / successfulRides * 100).toFixed(1)}%)`);
  }
  
  console.log(`Successfully created and completed ${completedRides.length} rides`);
  console.log(`Failed to create ${failedRides} rides`);
  console.log('Skipping bill creation - will let updateBillsToCompleted handle bills');
  
  return { 
    rides: successfulRides, 
    completedRides: completedRides.length, 
    driversUsed: driverIds.length 
  };
};

const updateBillsToCompleted = async () => {
  console.log('Updating all pending bills to completed status...');
  
  try {
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    // Step 1: Get all pending bills
    const searchResponse = await axios.get(`${API_URL}/billing/search`, {
      params: { payment_status: 'pending' },
      headers: adminHeaders
    });
    
    const pendingBills = searchResponse.data.data || [];
    console.log(`Found ${pendingBills.length} pending bills`);
    
    // Step 2: Update each bill
    let updatedCount = 0;
    
    for (const bill of pendingBills) {
      try {
        console.log(`Processing bill ${bill.bill_id}`);
        
        // First verify the bill exists and get its details
        const billDetails = await axios.get(`${API_URL}/billing/${bill.bill_id}`, {
          headers: adminHeaders
        });
        
        if (!billDetails.data.data) {
          console.error(`Bill ${bill.bill_id} not found`);
          continue;
        }
        
        // Process payment as admin
        await axios.post(`${API_URL}/billing/${bill.bill_id}/pay`, {
          payment_method: 'credit_card',
          amount: billDetails.data.data.total_amount
        }, {
          headers: adminHeaders
        });
        
        updatedCount++;
        console.log(`Successfully processed payment for bill ${bill.bill_id}`);
        
        // Log progress for large batches
        if (pendingBills.length > 100 && updatedCount % 50 === 0) {
          console.log(`Processed ${updatedCount}/${pendingBills.length} bills`);
        }
      } catch (error) {
        console.error(`Error updating bill ${bill.bill_id}:`, error.response?.data?.message || error.message);
      }
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Successfully updated ${updatedCount} bills to completed status`);
    
  } catch (error) {
    console.error('Error in bill update process:', error.message);
  }
};

// Comprehensive CRU (Create, Read, Update) Performance Testing
const createComprehensiveCRUPerformanceTest = async (sampleSize = 50) => {
  console.log(`Creating comprehensive CRU performance test with ${sampleSize} samples...`);
  
  // Authorization headers
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_CUSTOMER_TOKEN}`
  };
  
  // Test configurations
  const configurations = [
    { name: 'B', headers: { ...adminHeaders, 'X-Disable-Cache': 'true', 'X-Use-MongoDB': 'false' } },
    { name: 'BM', headers: { ...adminHeaders, 'X-Disable-Cache': 'true', 'X-Use-MongoDB': 'true' } },
    { name: 'BS', headers: { ...adminHeaders, 'X-Use-MongoDB': 'false' } },
    { name: 'BMSK', headers: { ...adminHeaders, 'X-Use-MongoDB': 'true' } }
  ];
  
  // Initialize results object
  const results = {};
  configurations.forEach(config => {
    results[config.name] = {
      // Overall averages
      create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      overall: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      
      // Driver operations
      driver_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      driver_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      driver_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      
      // Customer operations
      customer_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      customer_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      customer_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      
      // Ride operations
      ride_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      ride_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      ride_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      
      // Billing operations
      billing_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      billing_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
      billing_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 }
    };
  });
  
  // Used IDs for testing
  const testIds = {
    driver: [],
    customer: [],
    ride: [],
    billing: []
  };
  
  // Prepare test data - fetch some existing IDs for testing
  try {
    console.log('Getting existing IDs for testing...');
    
    // Get some driver IDs
    const driversResponse = await axios.get(`${API_URL}/drivers`, { headers: adminHeaders });
    if (driversResponse.data && driversResponse.data.data) {
      driversResponse.data.data.slice(0, 20).forEach(driver => {
        testIds.driver.push(driver.driver_id);
      });
    }
    
    // Get some customer IDs
    const customersResponse = await axios.get(`${API_URL}/customers`, { headers: adminHeaders });
    if (customersResponse.data && customersResponse.data.data) {
      customersResponse.data.data.slice(0, 20).forEach(customer => {
        testIds.customer.push(customer.customer_id);
      });
    }
    
    // Ensure we have at least our test IDs
    if (testIds.driver.length === 0 && TEST_DRIVER_ID) {
      testIds.driver.push(TEST_DRIVER_ID);
    }
    
    if (testIds.customer.length === 0 && TEST_CUSTOMER_ID) {
      testIds.customer.push(TEST_CUSTOMER_ID);
    }
    
    // Try to get some ride IDs
    if (testIds.customer.length > 0) {
        try {
            const ridesResponse = await axios.get(`${API_URL}/rides/customer/${testIds.customer[0]}`, { headers: adminHeaders });
            if (ridesResponse.data && ridesResponse.data.data) {
              ridesResponse.data.data.slice(0, 10).forEach(ride => {
                testIds.ride.push(ride.ride_id);
              });
            }
          } catch (error) {
            console.log('No rides found for first customer, trying to use other test data');
          }
        }
        
        // Try to get some billing IDs
        try {
          const billingResponse = await axios.get(`${API_URL}/billing/search`, { 
            headers: adminHeaders
          });
          if (billingResponse.data && billingResponse.data.data) {
            billingResponse.data.data.slice(0, 10).forEach(bill => {
              testIds.billing.push(bill.bill_id);
            });
          }
        } catch (error) {
          console.log('No billing records found for testing, will create or use new ones');
        }
        
        console.log('Prepared test IDs:', 
          Object.entries(testIds).map(([key, val]) => `${key}: ${val.length}`).join(', '));
        
      } catch (error) {
        console.error('Error preparing test IDs:', error.message);
      }
      
      // Run tests for each configuration
      for (const config of configurations) {
        console.log(`\n=== Testing ${config.name} configuration ===`);
        
        // 1. DRIVER Tests
        console.log('\n--- Testing DRIVER operations ---');
        
        // Driver CREATE
        try {
          console.log(`Testing driver CREATE operations for ${config.name}...`);
          const createTimes = [];
          const createSampleSize = Math.min(sampleSize, 10); // Limit to avoid DB bloat
          
          for (let i = 0; i < createSampleSize; i++) {
            try {
              const driver = {
                driver_id: generateSSN('driver'),
                first_name: `TestDriver${i}`,
                last_name: `CRU${Math.floor(Math.random() * 10000)}`,
                email: `testdriver${i}_${Date.now()}@crutest.com`,
                password: 'password123',
                phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
                address: `${Math.floor(Math.random() * 10000)} Test St`,
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                car_details: `Toyota Camry 2022`,
                status: 'available'
              };
              
              const startTime = Date.now();
              const response = await axios.post(`${API_URL}/drivers`, driver, { headers: config.headers });
              const endTime = Date.now();
              
              // Store created ID for update tests
              if (response.data && response.data.data && response.data.data.driver_id) {
                testIds.driver.push(response.data.data.driver_id);
              }
              
              createTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Driver CREATE test: ${i+1}/${createSampleSize}`);
              }
              
              // Add small delay to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error in driver CREATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (createTimes.length > 0) {
            const avgTime = createTimes.reduce((sum, time) => sum + time, 0) / createTimes.length;
            results[config.name].driver_create = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} driver CREATE: ${results[config.name].driver_create.requestsPerSecond} req/s, ${results[config.name].driver_create.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in driver CREATE tests:', error.message);
        }
        
        // Driver READ
        try {
          console.log(`Testing driver READ operations for ${config.name}...`);
          
          // First request to warm cache if needed
          if (config.name === 'BS' || config.name === 'BMSK') {
            await axios.get(`${API_URL}/drivers`, { headers: config.headers });
          }
          
          const readTimes = [];
          const readSampleSize = Math.min(sampleSize, 30);
          
          for (let i = 0; i < readSampleSize; i++) {
            try {
              const startTime = Date.now();
              await axios.get(`${API_URL}/drivers`, { headers: config.headers });
              const endTime = Date.now();
              
              readTimes.push(endTime - startTime);
              
              if (i % 10 === 0) {
                console.log(`Driver READ test: ${i+1}/${readSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              console.error(`Error in driver READ test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (readTimes.length > 0) {
            const avgTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length;
            results[config.name].driver_read = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} driver READ: ${results[config.name].driver_read.requestsPerSecond} req/s, ${results[config.name].driver_read.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in driver READ tests:', error.message);
        }
        
        // Driver UPDATE
        try {
          console.log(`Testing driver UPDATE operations for ${config.name}...`);
          
          const updateTimes = [];
          const updateSampleSize = Math.min(sampleSize, testIds.driver.length, 15);
          
          for (let i = 0; i < updateSampleSize; i++) {
            try {
              const driverId = testIds.driver[i % testIds.driver.length];
              
              const startTime = Date.now();
              await axios.patch(`${API_URL}/drivers/${driverId}/status`, {
                status: i % 2 === 0 ? 'available' : 'offline',
                latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
                longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
              }, { headers: config.headers });
              const endTime = Date.now();
              
              updateTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Driver UPDATE test: ${i+1}/${updateSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error in driver UPDATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (updateTimes.length > 0) {
            const avgTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
            results[config.name].driver_update = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} driver UPDATE: ${results[config.name].driver_update.requestsPerSecond} req/s, ${results[config.name].driver_update.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in driver UPDATE tests:', error.message);
        }
        
        // 2. CUSTOMER Tests
        console.log('\n--- Testing CUSTOMER operations ---');
        
        // Customer CREATE
        try {
          console.log(`Testing customer CREATE operations for ${config.name}...`);
          const createTimes = [];
          const createSampleSize = Math.min(sampleSize, 10); // Limit to avoid DB bloat
          
          for (let i = 0; i < createSampleSize; i++) {
            try {
              const customer = {
                customer_id: generateSSN('customer'),
                first_name: `TestCust${i}`,
                last_name: `CRU${Math.floor(Math.random() * 10000)}`,
                email: `testcustomer${i}_${Date.now()}@crutest.com`,
                password: 'password123',
                phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
                address: `${Math.floor(Math.random() * 10000)} Test St`,
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                credit_card: {
                  number: '4111111111111111',
                  expiry: '12/25',
                  cvv: '123',
                  name_on_card: `TestCust${i} CRU${Math.floor(Math.random() * 10000)}`
                }
              };
              
              const startTime = Date.now();
              const response = await axios.post(`${API_URL}/customers`, customer, { headers: config.headers });
              const endTime = Date.now();
              
              // Store created ID for update tests
              if (response.data && response.data.data && response.data.data.customer_id) {
                testIds.customer.push(response.data.data.customer_id);
              }
              
              createTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Customer CREATE test: ${i+1}/${createSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error in customer CREATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (createTimes.length > 0) {
            const avgTime = createTimes.reduce((sum, time) => sum + time, 0) / createTimes.length;
            results[config.name].customer_create = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} customer CREATE: ${results[config.name].customer_create.requestsPerSecond} req/s, ${results[config.name].customer_create.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in customer CREATE tests:', error.message);
        }
        
        // Customer READ
        try {
          console.log(`Testing customer READ operations for ${config.name}...`);
          
          // First request to warm cache if needed
          if (config.name === 'BS' || config.name === 'BMSK') {
            await axios.get(`${API_URL}/customers`, { headers: config.headers });
          }
          
          const readTimes = [];
          const readSampleSize = Math.min(sampleSize, 30);
          
          for (let i = 0; i < readSampleSize; i++) {
            try {
              const startTime = Date.now();
              await axios.get(`${API_URL}/customers`, { headers: config.headers });
              const endTime = Date.now();
              
              readTimes.push(endTime - startTime);
              
              if (i % 10 === 0) {
                console.log(`Customer READ test: ${i+1}/${readSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              console.error(`Error in customer READ test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (readTimes.length > 0) {
            const avgTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length;
            results[config.name].customer_read = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} customer READ: ${results[config.name].customer_read.requestsPerSecond} req/s, ${results[config.name].customer_read.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in customer READ tests:', error.message);
        }
        
        // Customer UPDATE
        try {
          console.log(`Testing customer UPDATE operations for ${config.name}...`);
          
          const updateTimes = [];
          const updateSampleSize = Math.min(sampleSize, testIds.customer.length, 15);
          
          for (let i = 0; i < updateSampleSize; i++) {
            try {
              const customerId = testIds.customer[i % testIds.customer.length];
              
              const startTime = Date.now();
              await axios.patch(`${API_URL}/customers/${customerId}/location`, {
                latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
                longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
              }, { headers: config.headers });
              const endTime = Date.now();
              
              updateTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Customer UPDATE test: ${i+1}/${updateSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error in customer UPDATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (updateTimes.length > 0) {
            const avgTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
            results[config.name].customer_update = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} customer UPDATE: ${results[config.name].customer_update.requestsPerSecond} req/s, ${results[config.name].customer_update.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in customer UPDATE tests:', error.message);
        }
        
        // 3. RIDE Tests
        console.log('\n--- Testing RIDE operations ---');
        
        // Ride CREATE
        try {
          console.log(`Testing ride CREATE operations for ${config.name}...`);
          const createTimes = [];
          const createSampleSize = Math.min(sampleSize, 5); // Limit to avoid DB bloat
          
          for (let i = 0; i < createSampleSize; i++) {
            try {
              // Make sure we have test driver and customer IDs
              if (testIds.driver.length === 0 || testIds.customer.length === 0) {
                console.error('No test driver or customer IDs available for ride creation');
                break;
              }
              
              // Random pickup/dropoff within San Francisco area
              const pickup = {
                latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
                longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
              };
              
              const dropoff = {
                latitude: pickup.latitude + (Math.random() * 0.1 - 0.05),
                longitude: pickup.longitude + (Math.random() * 0.1 - 0.05)
              };
              
              const rideData = {
                pickup_location: pickup,
                dropoff_location: dropoff,
                date_time: new Date().toISOString(),
                passenger_count: Math.floor(Math.random() * 4) + 1,
                driver_id: testIds.driver[i % testIds.driver.length],
                customer_id: testIds.customer[i % testIds.customer.length]
              };
              
              const startTime = Date.now();
              const response = await axios.post(`${API_URL}/rides/test-create`, rideData, { headers: config.headers });
              const endTime = Date.now();
              
              // Store created ride ID
              if (response.data && response.data.data && response.data.data.ride_id) {
                testIds.ride.push(response.data.data.ride_id);
              }
              
              createTimes.push(endTime - startTime);
              
              console.log(`Ride CREATE test: ${i+1}/${createSampleSize}`);
              
              // Add delay to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error in ride CREATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (createTimes.length > 0) {
            const avgTime = createTimes.reduce((sum, time) => sum + time, 0) / createTimes.length;
            results[config.name].ride_create = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} ride CREATE: ${results[config.name].ride_create.requestsPerSecond} req/s, ${results[config.name].ride_create.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in ride CREATE tests:', error.message);
        }
        
        // Ride READ
        try {
          console.log(`Testing ride READ operations for ${config.name}...`);
          
          // Need a test customer ID for this
          if (testIds.customer.length === 0) {
            console.error('No test customer IDs available for ride reading');
            continue;
          }
          
          // First request to warm cache if needed
          if (config.name === 'BS' || config.name === 'BMSK') {
            await axios.get(`${API_URL}/rides/customer/${testIds.customer[0]}`, { headers: config.headers });
          }
          
          const readTimes = [];
          const readSampleSize = Math.min(sampleSize, 20);
          
          for (let i = 0; i < readSampleSize; i++) {
            try {
              // Cycle through customer IDs
              const customerId = testIds.customer[i % testIds.customer.length];
              
              const startTime = Date.now();
              await axios.get(`${API_URL}/rides/customer/${customerId}`, { headers: config.headers });
              const endTime = Date.now();
              
              readTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Ride READ test: ${i+1}/${readSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error in ride READ test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (readTimes.length > 0) {
            const avgTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length;
            results[config.name].ride_read = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} ride READ: ${results[config.name].ride_read.requestsPerSecond} req/s, ${results[config.name].ride_read.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in ride READ tests:', error.message);
        }
        
        // Ride UPDATE (Accept/Start/Complete)
        try {
          console.log(`Testing ride UPDATE operations for ${config.name}...`);
          
          // We need ride IDs for this
          if (testIds.ride.length < 3) {
            // Create a few test rides if we don't have any
            for (let i = 0; i < 3; i++) {
              if (testIds.driver.length === 0 || testIds.customer.length === 0) break;
              
              try {
                const pickup = {
                  latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
                  longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
                };
                
                const dropoff = {
                  latitude: pickup.latitude + (Math.random() * 0.1 - 0.05),
                  longitude: pickup.longitude + (Math.random() * 0.1 - 0.05)
                };
                
                const rideData = {
                  pickup_location: pickup,
                  dropoff_location: dropoff,
                  date_time: new Date().toISOString(),
                  passenger_count: Math.floor(Math.random() * 4) + 1,
                  driver_id: testIds.driver[i % testIds.driver.length],
                  customer_id: testIds.customer[i % testIds.customer.length]
                };
                
                const response = await axios.post(`${API_URL}/rides/test-create`, rideData, { headers: adminHeaders });
                
                if (response.data && response.data.data && response.data.data.ride_id) {
                  testIds.ride.push(response.data.data.ride_id);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
              } catch (error) {
                console.error('Error creating test ride:', error.message);
              }
            }
          }
          
          if (testIds.ride.length === 0) {
            console.error('No test ride IDs available for update tests');
            continue;
          }
          
          const updateTimes = [];
          const updateSampleSize = Math.min(sampleSize, testIds.ride.length * 3, 15);
          
          for (let i = 0; i < updateSampleSize; i++) {
            try {
              const rideId = testIds.ride[i % testIds.ride.length];
              const updateType = i % 3; // 0: accept, 1: start, 2: complete
              let endpoint, payload;
              
              switch (updateType) {
                case 0:
                  endpoint = `/rides/test/${rideId}/accept`;
                  payload = { driver_id: testIds.driver[0] };
                  break;
                case 1:
                  endpoint = `/rides/test/${rideId}/start`;
                  payload = {};
                  break;
                case 2:
                  endpoint = `/rides/test/${rideId}/complete`;
                  payload = {};
                  break;
              }
              
              const startTime = Date.now();
              await axios.patch(`${API_URL}${endpoint}`, payload, { headers: config.headers });
              const endTime = Date.now();
              
              updateTimes.push(endTime - startTime);
              
              if (i % 3 === 0) {
                console.log(`Ride UPDATE test: ${i+1}/${updateSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error in ride UPDATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (updateTimes.length > 0) {
            const avgTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
            results[config.name].ride_update = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} ride UPDATE: ${results[config.name].ride_update.requestsPerSecond} req/s, ${results[config.name].ride_update.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in ride UPDATE tests:', error.message);
        }
        
        // 4. BILLING Tests
        console.log('\n--- Testing BILLING operations ---');
        
        // Billing READ
        try {
          console.log(`Testing billing READ operations for ${config.name}...`);
          
          // First request to warm cache if needed
          if (config.name === 'BS' || config.name === 'BMSK') {
            await axios.get(`${API_URL}/billing/search`, { headers: config.headers });
          }
          
          const readTimes = [];
          const readSampleSize = Math.min(sampleSize, 20);
          
          for (let i = 0; i < readSampleSize; i++) {
            try {
              const startTime = Date.now();
              await axios.get(`${API_URL}/billing/search`, { headers: config.headers });
              const endTime = Date.now();
              
              readTimes.push(endTime - startTime);
              
              if (i % 5 === 0) {
                console.log(`Billing READ test: ${i+1}/${readSampleSize}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error in billing READ test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (readTimes.length > 0) {
            const avgTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length;
            results[config.name].billing_read = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} billing READ: ${results[config.name].billing_read.requestsPerSecond} req/s, ${results[config.name].billing_read.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in billing READ tests:', error.message);
        }
        
        // Billing UPDATE (Payment processing)
        try {
          console.log(`Testing billing UPDATE operations for ${config.name}...`);
          
          // We need billing IDs for this
          if (testIds.billing.length === 0) {
            try {
              const billingResponse = await axios.get(`${API_URL}/billing/search`, { 
                params: { payment_status: 'pending' },
                headers: adminHeaders
              });
              if (billingResponse.data && billingResponse.data.data) {
                billingResponse.data.data.slice(0, 5).forEach(bill => {
                  testIds.billing.push(bill.bill_id);
                });
              }
            } catch (error) {
              console.log('No pending billing records found for update tests');
            }
          }
          
          if (testIds.billing.length === 0) {
            console.error('No billing IDs available for update tests');
            continue;
          }
          
          const updateTimes = [];
          const updateSampleSize = Math.min(sampleSize, testIds.billing.length, 10);
          
          for (let i = 0; i < updateSampleSize; i++) {
            try {
              const billId = testIds.billing[i % testIds.billing.length];
              
              // Get bill details first
              const billDetails = await axios.get(`${API_URL}/billing/${billId}`, { headers: config.headers });
              
              if (!billDetails.data || !billDetails.data.data) {
                console.error(`Bill ${billId} not found or not accessible`);
                continue;
              }
              
              const startTime = Date.now();
              await axios.post(`${API_URL}/billing/${billId}/pay`, {
                payment_method: 'credit_card',
                amount: billDetails.data.data.total_amount
              }, { headers: config.headers });
              const endTime = Date.now();
              
              updateTimes.push(endTime - startTime);
              
              console.log(`Billing UPDATE test: ${i+1}/${updateSampleSize}`);
              
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error in billing UPDATE test ${i}:`, error.message);
            }
          }
          
          // Calculate metrics
          if (updateTimes.length > 0) {
            const avgTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
            results[config.name].billing_update = {
              responseTime: Math.round(avgTime),
              requestsPerSecond: Math.round(1000 / avgTime),
              throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
            };
            
            console.log(`${config.name} billing UPDATE: ${results[config.name].billing_update.requestsPerSecond} req/s, ${results[config.name].billing_update.responseTime}ms avg`);
          }
        } catch (error) {
          console.error('Error in billing UPDATE tests:', error.message);
        }
        
        // Calculate overall averages
        const entities = ['driver', 'customer', 'ride', 'billing'];
        const operations = ['create', 'read', 'update'];
        
        // For each operation type, calculate average across all entities
        operations.forEach(op => {
          let validCount = 0;
          let totalRps = 0;
          let totalResponseTime = 0;
          let totalThroughput = 0;
          
          entities.forEach(entity => {
            const key = `${entity}_${op}`;
            if (results[config.name][key] && results[config.name][key].requestsPerSecond > 0) {
              validCount++;
              totalRps += results[config.name][key].requestsPerSecond;
              totalResponseTime += results[config.name][key].responseTime;
              totalThroughput += results[config.name][key].throughput;
            }
          });
          
          if (validCount > 0) {
            results[config.name][op] = {
              requestsPerSecond: Math.round(totalRps / validCount),
              responseTime: Math.round(totalResponseTime / validCount),
              throughput: Math.round(totalThroughput / validCount)
            };
            
            console.log(`${config.name} ${op.toUpperCase()} AVERAGE: ${results[config.name][op].requestsPerSecond} req/s, ${results[config.name][op].responseTime}ms avg`);
          }
        });
        
        // Calculate overall average across all operations
        let validOps = 0;
        let totalRps = 0;
        let totalResponseTime = 0;
        let totalThroughput = 0;
        
        operations.forEach(op => {
          if (results[config.name][op] && results[config.name][op].requestsPerSecond > 0) {
            validOps++;
            totalRps += results[config.name][op].requestsPerSecond;
            totalResponseTime += results[config.name][op].responseTime;
            totalThroughput += results[config.name][op].throughput;
          }
        });
        
        if (validOps > 0) {
          results[config.name].overall = {
            requestsPerSecond: Math.round(totalRps / validOps),
            responseTime: Math.round(totalResponseTime / validOps),
            throughput: Math.round(totalThroughput / validOps)
          };
          
          console.log(`${config.name} OVERALL: ${results[config.name].overall.requestsPerSecond} req/s, ${results[config.name].overall.responseTime}ms avg`);
        }
        
        // Add a pause between configurations
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Save results to a file
      try {
        fs.writeFileSync('cru_performance_results.json', JSON.stringify(results, null, 2));
        console.log("CRU performance results saved to cru_performance_results.json");
      } catch (error) {
        console.error("Error saving CRU performance results:", error.message);
      }
      
      return results;
    };
    
    // Main function
    const main = async () => {
      try {
        console.log("Starting test data generation and performance testing...");
        
        // Login to get admin token
        const loggedIn = await loginAsAdmin();
        if (!loggedIn) {
          console.error('Failed to login or create admin account. Exiting.');
          return;
        }
        
        // Create test customer account
        const testAccountsCreated = await createTestAccounts();
        if (!testAccountsCreated) {
          console.error('Failed to create test accounts. Exiting.');
          return;
        }
        
        // Check command line args for action
        const isSmallTest = process.argv.includes('--small');
        const skipDataGeneration = process.argv.includes('--skip-generation');
        const skipTesting = process.argv.includes('--skip-testing');
        const onlyTest = process.argv.includes('--only-test');
        
        if (onlyTest) {
          console.log("Only running performance tests, skipping data generation...");
          await createComprehensiveCRUPerformanceTest(50);
          return;
        }
        
        if (!skipDataGeneration) {
          const targetDrivers = isSmallTest ? 100 : 1000;
          const targetCustomers = isSmallTest ? 100 : 1000;
          const targetRides = isSmallTest ? 20 : 100;
          
          console.log(`Running ${isSmallTest ? 'small' : 'normal'} test data generation`);
          
          // Generate drivers
          await generateDrivers(targetDrivers);
          
          // Generate customers
          await generateCustomers(targetCustomers);
          
          // Create rides and bills
          const rideResults = await createRidesAndBills(targetRides);
          
          // Complete bills
          await updateBillsToCompleted();
          
          console.log('=== DATA GENERATION COMPLETE ===');
          console.log(`Generated approximately:`);
          console.log(`- ${targetDrivers} drivers`);
          console.log(`- ${targetCustomers} customers`);
          console.log(`- ${targetRides} rides/bills (approx)`);
          if (rideResults && rideResults.driversUsed) {
            console.log(`- Used ${rideResults.driversUsed} different drivers from database`);
          }
        }
        
        if (!skipTesting) {
          // Run comprehensive performance tests
          console.log("\n=== STARTING COMPREHENSIVE PERFORMANCE TESTING ===");
          await createComprehensiveCRUPerformanceTest(50);
        }
        
        // Generate graphs for results
        try {
          const generateGraphsScript = require('./generateCRUPerformanceGraphs');
          console.log("Generated performance graphs");
        } catch (error) {
          console.log("Could not automatically generate performance graphs:", error.message);
          console.log("Run 'node generateCRUPerformanceGraphs.js' separately to generate graphs");
        }
        
        console.log('\nTest accounts created:');
        console.log(' - Customer: test_customer@test.com / password123');
        console.log(' - Admin: admin@test.com / password123');
        console.log('\nUse these accounts for JMeter tests or manual testing');
        
      } catch (error) {
        console.error('Error in main process:', error);
      }
    };
    
    // Run the main function
    main();



    //The script provides useful command-line options:

//--small: Run with smaller data generation counts
//--skip-generation: Skip data generation and only run testing
//--skip-testing: Skip testing and only generate data
//--only-test: Only run the performance tests without any data generation