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

// Create test accounts for JMeter testing
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
      }
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
    
    // Create a test driver
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
      car_details: 'Toyota Camry 2020',
      status: 'available',
      account_status: 'approved', // Make sure the driver is approved
      intro_media: {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // SF coordinates [longitude, latitude]
        }
      }
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
    
    // Login as driver
    const driverLoginResponse = await axios.post(`${API_URL}/auth/driver/login`, {
      email: driverEmail,
      password: 'password123',
      role: 'driver'
    });
    
    TEST_DRIVER_TOKEN = driverLoginResponse.data.token;
    console.log('Test driver logged in successfully');
    
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

// UPDATED: Create rides and bills with diverse customer-driver pairs
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
  
  // Get available drivers
  let drivers = [];
  try {
    const driverResponse = await axios.get(`${API_URL}/drivers`, { 
      headers: adminHeaders,
      params: { status: 'available' } 
    });
    drivers = driverResponse.data.data || [];
    console.log(`Retrieved ${drivers.length} drivers for ride generation`);
    
    // If not enough drivers were found, add our test driver
    if (!drivers.find(d => d.driver_id === TEST_DRIVER_ID)) {
      drivers.push({ driver_id: TEST_DRIVER_ID });
    }
  } catch (error) {
    console.error('Error retrieving drivers:', error.message);
    // Fallback to test driver
    drivers = [{ driver_id: TEST_DRIVER_ID }];
  }
  
  // If we still don't have enough customers or drivers, don't proceed
  if (customers.length === 0 || drivers.length === 0) {
    console.error('No customers or drivers available for test ride generation. Aborting.');
    return { rides: 0, bills: 0 };
  }
  
  // We'll use our test customer and driver tokens for now, but in a real system
  // we would authenticate as each customer
  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_CUSTOMER_TOKEN}`
  };
  
  const driverHeaders = {
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${TEST_DRIVER_TOKEN}`
  };
  
  let successfulRides = 0;
  let successfulBills = 0;
  let failedRides = 0;
  let failedBills = 0;
  
  for (let i = 0; i < count; i++) {
    try {
      // Generate a ride with random customer and driver
      // Note: In a real system, we'd need to authenticate as each customer
      // For now, we're using our test customer to create rides for all customers
      
      // Select random customer and driver for variety
      // For a more realistic pattern, use weighted selection (some drivers more popular, etc.)
      const customerIndex = Math.floor(Math.random() * customers.length);
      const driverIndex = Math.floor(Math.random() * drivers.length);
      
      const selectedCustomer = customers[customerIndex];
      const selectedDriver = drivers[driverIndex];
      
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
      
      // Create a ride with random data but specify the selected driver
      const rideData = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        date_time: new Date().toISOString(),
        passenger_count: Math.floor(Math.random() * 4) + 1,
        driver_id: selectedDriver.driver_id
      };
      
      // With retry logic
      let rideId = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!rideId && retryCount < maxRetries) {
        try {
          const rideResponse = await axios.post(`${API_URL}/rides`, rideData, { headers: customerHeaders });
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
      
      // Step 2: Accept ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/accept`, {}, { headers: driverHeaders });
      } catch (error) {
        console.error(`Error accepting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue; // Skip to next ride if accept failed
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Start ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/start`, {}, { headers: driverHeaders });
      } catch (error) {
        console.error(`Error starting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Complete ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/complete`, {}, { headers: driverHeaders });
      } catch (error) {
        console.error(`Error completing ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 5: Create bill as driver
      const billData = {
        ride_id: rideId
      };
      
      try {
        await axios.post(`${API_URL}/billing`, billData, { headers: driverHeaders });
        successfulBills++;
      } catch (error) {
        failedBills++;
        console.error(`Error creating bill for ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
      }
      
      // A longer delay between full ride cycles to avoid rate-limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Unexpected error in ride/bill creation for ${i+1}/${count}:`, error.message);
    }
  }
  
  console.log(`Successfully created ${successfulRides} rides and ${successfulBills} bills`);
  console.log(`Failed to create ${failedRides} rides and ${failedBills} bills`);
  return { rides: successfulRides, bills: successfulBills };
};

// Performance test data creation
const createPerformanceTestData = async (sampleSize = 200) => {
  console.log(`Creating performance test data with ${sampleSize} samples...`);
  
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_CUSTOMER_TOKEN}`
  };
  
  const driverHeaders = {
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${TEST_DRIVER_TOKEN}`
  };
  
  // Create test data for each configuration
  const testData = {
    B: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
    BS: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
    BSK: { requestsPerSecond: 0, responseTime: 0, throughput: 0 }
  };
  
  // Test Base configuration (B)
  console.log("Testing Base configuration (B)...");
  try {
    // Disable caching for baseline test
    const baseHeaders = { ...adminHeaders, 'X-Disable-Cache': 'true' };
    
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
  
  // Test Base + SQL Caching (B+S)
  console.log("Testing Base + SQL Caching configuration (B+S)...");
  try {
    // Enable caching
    const cachedHeaders = { ...adminHeaders };
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
  
  // Test Base + SQL Caching + Kafka (B+S+K)
  // For this test we'll use operations that trigger Kafka messaging
  console.log("Testing Base + SQL Caching + Kafka configuration (B+S+K)...");
  try {
    const startBSK = Date.now();
    
    // Use a mixture of operations that trigger Kafka events
    for (let i = 0; i < sampleSize; i++) {
      const operation = i % 3;
      if (operation === 0) {
        // Read operation with caching
        await axios.get(`${API_URL}/drivers`, { headers: adminHeaders });
      } else if (operation === 1) {
        // Status update (triggers Kafka)
        await axios.patch(`${API_URL}/drivers/${TEST_DRIVER_ID}/status`, {
          status: i % 2 === 0 ? 'available' : 'offline',
          latitude: 37.7749,
          longitude: -122.4194
        }, { headers: driverHeaders });
      } else {
        // Customer location update (triggers Kafka)
        await axios.patch(`${API_URL}/customers/${TEST_CUSTOMER_ID}/location`, {
          latitude: 37.7749,
          longitude: -122.4194
        }, { headers: customerHeaders });
      }
      
      if (i % 100 === 0) console.log(`B+S+K test: ${i}/${sampleSize}`);
    }
    
    const endBSK = Date.now();
    
    const durationBSK = (endBSK - startBSK) / 1000; // in seconds
    testData.BSK.requestsPerSecond = Math.round(sampleSize / durationBSK);
    testData.BSK.responseTime = Math.round(durationBSK * 1000 / sampleSize); // in ms
    testData.BSK.throughput = testData.BSK.requestsPerSecond * 0.8; // estimated
    
    console.log(`B+S+K test completed: ${testData.BSK.requestsPerSecond} req/s, ${testData.BSK.responseTime}ms avg`);
  } catch (error) {
    console.error("Error testing B+S+K configuration:", error.message);
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
    
    // Create test accounts for ride and bill creation
    const testAccountsCreated = await createTestAccounts();
    if (!testAccountsCreated) {
      console.error('Failed to create test accounts. Exiting.');
      return;
    }
    
    // Generate entities
    // Check command line args for smaller test
    const isSmallTest = process.argv.includes('--small');
    
    const targetDrivers = isSmallTest ? 100 : 5000; // Reduced from 10000 to avoid overwhelming the system
    const targetCustomers = isSmallTest ? 100 : 5000; // Reduced from 10000 to avoid overwhelming the system
    const targetRides = isSmallTest ? 20 : 500; // Reduced from 1000 to avoid overwhelming the system
    
    console.log(`Running ${isSmallTest ? 'small' : 'full'} test data generation`);
    
    // Generate drivers
    // Generate drivers
    await generateDrivers(targetDrivers);
    
    // Generate customers
    await generateCustomers(targetCustomers);
    
    // Create rides and bills
    await createRidesAndBills(targetRides);
    
    // Run performance tests
    await createPerformanceTestData(200);
    
    console.log('=== DATA GENERATION COMPLETE ===');
    console.log(`Generated approximately:`);
    console.log(`- ${targetDrivers} drivers`);
    console.log(`- ${targetCustomers} customers`);
    console.log(`- ${targetRides} rides/bills (approx)`);
    console.log('\nTest accounts created for JMeter:');
    console.log(' - Customer: test_customer@test.com / password123');
    console.log(' - Driver: test_driver@test.com / password123');
    console.log(' - Admin: admin@test.com / password123');
    
    console.log('\nYou can now run JMeter tests for performance analysis');
    
  } catch (error) {
    console.error('Error in data generation process:', error);
  }
};

// Run the main function
main();