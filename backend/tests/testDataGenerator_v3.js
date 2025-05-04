// testDataGenerator.js - Updated Version
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

// Helper functions
const generateSSN = (type = 'admin') => {
  let counter;
  if (type === 'driver') {
    counter = driverCounter++;
  } else if (type === 'customer') {
    counter = customerCounter++;
  } else {
    counter = adminCounter++;
  }
  const part1 = String(100 + (counter % 900)).padStart(3, '0');
  const part2 = String(10 + (Math.floor(counter / 900) % 90)).padStart(2, '0');
  const part3 = String(1000 + (Math.floor(counter / 81000) % 9000)).padStart(4, '0');
  return `${part1}-${part2}-${part3}`;
};

const generateRideId = () => {
  const id = rideCounter++;
  const part1 = String(100 + (id % 900)).padStart(3, '0');
  const part2 = String(10 + (Math.floor(id / 900) % 90)).padStart(2, '0');
  const part3 = String(1000 + (Math.floor(id / 81000) % 9000)).padStart(4, '0');
  return `${part1}-${part2}-${part3}`;
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
    
    return true;
  } catch (error) {
    console.error('Error creating test customer account:', error.response?.data?.message || error.message);
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

// Updated createRidesAndBills function to use drivers from the database
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
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Successfully updated ${updatedCount} bills to completed status`);
    
  } catch (error) {
    console.error('Error in bill update process:', error.message);
    
    // Additional debugging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Update the performance test data function
// Modified section of testDataGenerator_v3.js to include MongoDB measurement

const createPerformanceTestData = async (sampleSize = 10000) => {
  console.log(`Creating performance test data with ${sampleSize} samples...`);
  
  // Get available drivers
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_CUSTOMER_TOKEN}`
  };
  
  // Get available drivers from database
  let drivers = [];
  try {
    const driverResponse = await axios.get(`${API_URL}/drivers`, { 
      headers: adminHeaders
    });
    drivers = driverResponse.data.data || [];
    console.log(`Retrieved ${drivers.length} drivers for performance testing`);
    
    // Use a subset of drivers if there are too many
    if (drivers.length > 50) {
      drivers = drivers.slice(0, 50);
      console.log(`Using a subset of 50 drivers for performance testing`);
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
  
  // Create test data for each configuration
  const testData = {
    B: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
    BM: { requestsPerSecond: 0, responseTime: 0, throughput: 0 }, // MongoDB specific
    BS: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
    BMSK: { requestsPerSecond: 0, responseTime: 0, throughput: 0 } // Full stack with MongoDB
  };
  
  // Test Base configuration (B) - Simulated relational database
  console.log("Testing Base configuration (B)...");
  try {
    // Disable both MongoDB and caching for baseline test
    const baseHeaders = { 
      ...adminHeaders, 
      'X-Disable-Cache': 'true',
      'X-Use-MongoDB': 'false' // New header to control database choice
    };
    
    const startB = Date.now();
    for (let i = 0; i < sampleSize; i++) {
      await axios.get(`${API_URL}/drivers`, { headers: baseHeaders });
      if (i % 100 === 0) console.log(`Base test: ${i}/${sampleSize}`);
    }
    const endB = Date.now();
    
    const durationB = (endB - startB) / 1000; // in seconds
    testData.B.requestsPerSecond = Math.round(sampleSize / durationB);
    testData.B.responseTime = Math.round(durationB * 1000 / sampleSize); // in ms
    testData.B.throughput = testData.B.requestsPerSecond * 0.8; // estimated
    
    console.log(`Base (B) test completed: ${testData.B.requestsPerSecond} req/s, ${testData.B.responseTime}ms avg`);
  } catch (error) {
    console.error("Error testing Base configuration:", error.message);
  }
  
  // Test Base + MongoDB (B+M)
  console.log("Testing Base + MongoDB configuration (B+M)...");
  try {
    // Enable MongoDB, disable caching
    const mongoHeaders = { 
      ...adminHeaders, 
      'X-Disable-Cache': 'true',
      'X-Use-MongoDB': 'true' 
    };
    
    const startBM = Date.now();
    for (let i = 0; i < sampleSize; i++) {
      await axios.get(`${API_URL}/drivers`, { headers: mongoHeaders });
      if (i % 100 === 0) console.log(`B+M test: ${i}/${sampleSize}`);
    }
    const endBM = Date.now();
    
    const durationBM = (endBM - startBM) / 1000; // in seconds
    testData.BM.requestsPerSecond = Math.round(sampleSize / durationBM);
    testData.BM.responseTime = Math.round(durationBM * 1000 / sampleSize); // in ms
    testData.BM.throughput = testData.BM.requestsPerSecond * 0.8; // estimated
    
    console.log(`B+M test completed: ${testData.BM.requestsPerSecond} req/s, ${testData.BM.responseTime}ms avg`);
  } catch (error) {
    console.error("Error testing B+M configuration:", error.message);
  }
  
  // Test Base + SQL Caching (B+S)
  console.log("Testing Base + SQL Caching configuration (B+S)...");
  try {
    // Enable caching, disable MongoDB
    const cachedHeaders = { 
      ...adminHeaders,
      'X-Use-MongoDB': 'false'
    };
    delete cachedHeaders['X-Disable-Cache'];
    
    // First request to warm up cache
    await axios.get(`${API_URL}/drivers`, { headers: cachedHeaders });
    
    const startBS = Date.now();
    for (let i = 0; i < sampleSize; i++) {
      await axios.get(`${API_URL}/drivers`, { headers: cachedHeaders });
      if (i % 100 === 0) console.log(`B+S test: ${i}/${sampleSize}`);
    }
    const endBS = Date.now();
    
    const durationBS = (endBS - startBS) / 1000; // in seconds
    testData.BS.requestsPerSecond = Math.round(sampleSize / durationBS);
    testData.BS.responseTime = Math.round(durationBS * 1000 / sampleSize); // in ms
    testData.BS.throughput = testData.BS.requestsPerSecond * 0.8; // estimated
    
    console.log(`B+S test completed: ${testData.BS.requestsPerSecond} req/s, ${testData.BS.responseTime}ms avg`);
  } catch (error) {
    console.error("Error testing B+S configuration:", error.message);
  }
  
  // Test Base + MongoDB + SQL Caching + Kafka (B+M+S+K)
  console.log("Testing full stack configuration (B+M+S+K)...");
  try {
    // Enable MongoDB and caching
    const fullStackHeaders = { 
      ...adminHeaders,
      'X-Use-MongoDB': 'true'
    };
    
    // Warm up cache first
    await axios.get(`${API_URL}/drivers`, { headers: fullStackHeaders });
    
    const startBMSK = Date.now();
    
    // Use a mixture of operations that trigger Kafka events with different drivers
    for (let i = 0; i < sampleSize; i++) {
      const operation = i % 3;
      
      // Select a random driver for this operation
      const randomDriver = drivers[i % drivers.length];
      
      if (operation === 0) {
        // Read operation with caching and MongoDB
        await axios.get(`${API_URL}/drivers`, { headers: fullStackHeaders });
      } else if (operation === 1) {
        // Status update (triggers Kafka) using different drivers
        await axios.patch(`${API_URL}/drivers/${randomDriver.driver_id}/status`, {
          status: i % 2 === 0 ? 'available' : 'offline',
          latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
          longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
        }, { headers: fullStackHeaders });
      } else {
        // Customer location update (triggers Kafka)
        await axios.patch(`${API_URL}/customers/${TEST_CUSTOMER_ID}/location`, {
          latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
          longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
        }, { headers: { ...customerHeaders, 'X-Use-MongoDB': 'true' } });
      }
      
      if (i % 100 === 0) console.log(`B+M+S+K test: ${i}/${sampleSize}`);
    }
    
    const endBMSK = Date.now();
    
    const durationBMSK = (endBMSK - startBMSK) / 1000; // in seconds
    testData.BMSK.requestsPerSecond = Math.round(sampleSize / durationBMSK);
    testData.BMSK.responseTime = Math.round(durationBMSK * 1000 / sampleSize); // in ms
    testData.BMSK.throughput = testData.BMSK.requestsPerSecond * 0.8; // estimated
    
    console.log(`B+M+S+K test completed: ${testData.BMSK.requestsPerSecond} req/s, ${testData.BMSK.responseTime}ms avg`);
  } catch (error) {
    console.error("Error testing B+M+S+K configuration:", error.message);
  }
  
  // Save performance test results to a file
  try {
    fs.writeFileSync('performance_results.json', JSON.stringify(testData, null, 2));
    console.log("Performance test results saved to performance_results.json");
  } catch (error) {
    console.error("Error saving performance results:", error.message);
  }
  
  return testData;
};

// Main function
const main = async () => {
  try {
    console.log("Starting test data generation...");
    
    // Login to get admin token
    const loggedIn = await loginAsAdmin();
    if (!loggedIn) {
      console.error('Failed to login or create admin account. Exiting.');
      return;
    }
    
    // Create test customer account
    const testAccountsCreated = await createTestAccounts();
    if (!testAccountsCreated) {
      console.error('Failed to create test customer account. Exiting.');
      return;
    }
    
    // Generate entities
    // Check command line args for smaller test
    const isSmallTest = process.argv.includes('--small');
    
    const targetDrivers = isSmallTest ? 100 : 10000;
    const targetCustomers = isSmallTest ? 100 : 10000;
    const targetRides = isSmallTest ? 20 : 100000;
    
    console.log(`Running ${isSmallTest ? 'small' : 'full'} test data generation`);
    
    // Generate drivers
    await generateDrivers(targetDrivers);
    
    // Generate customers
    await generateCustomers(targetCustomers);
    
    // Create rides and bills with database drivers
    const rideResults = await createRidesAndBills(targetRides);

    // Complete bills
    await updateBillsToCompleted();
    
    // Run performance tests with database drivers
    await createPerformanceTestData(99);
    
    console.log('=== DATA GENERATION COMPLETE ===');
    console.log(`Generated approximately:`);
    console.log(`- ${targetDrivers} drivers`);
    console.log(`- ${targetCustomers} customers`);
    console.log(`- ${targetRides} rides/bills (approx)`);
    console.log(`- Used ${rideResults.driversUsed} different drivers from database`);
    console.log('\nTest accounts created for JMeter:');
    console.log(' - Customer: test_customer@test.com / password123');
    console.log(' - Admin: admin@test.com / password123');
    
    console.log('\nYou can now run JMeter tests for performance analysis');
    
  } catch (error) {
    console.error('Error in data generation process:', error);
  }
};

// Run the main function
main();