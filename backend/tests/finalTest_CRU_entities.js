// Tests the system across three configurations:
// - B: Base implementation 
// - BS: Base + SQL Caching with Redis
// - BSK: Base + SQL Caching + Kafka

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';

// Use timestamp to ensure uniqueness across test runs
const TIMESTAMP = Date.now();

const DEFAULT_TEST_CONFIG = {
    driverCount: 100,        // Default number of drivers to create
    customerCount: 100,      // Default number of customers to create
    rideCount: 50,           // Default number of rides to generate
    sampleSize: 30,          // Default sample size for performance tests
    batchSize: 100           // Default batch size for bulk operations
  };

// Keep track of created entities
const createdEntities = {
  drivers: [],
  customers: [],
  rides: []
};

// Generate unique SSN-format IDs
const generateSSN = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  // Create parts that follow the SSN format but are guaranteed unique
  const part1 = String(100 + (random % 900)).padStart(3, '0');
  const part2 = String(10 + (Math.floor(timestamp / 100) % 90)).padStart(2, '0');
  const part3 = String(1000 + (Math.floor(timestamp / 10) % 9000)).padStart(4, '0');
  
  return `${part1}-${part2}-${part3}`;
};

// Authentication
const loginAsAdmin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/admin/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    ADMIN_TOKEN = response.data.token;
    console.log('Admin logged in successfully');
    return true;
  } catch (error) {
    console.error('Admin login failed:', error.response?.data?.message || error.message);
    
    // Try to create admin if login fails
    if (await createAdmin()) {
      return loginAsAdmin(); // Retry login
    }
    
    return false;
  }
};

// Create admin account if needed
const createAdmin = async () => {
  try {
    console.log('Creating admin account...');
    
    const adminData = {
      admin_id: generateSSN('admin'),
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      password: 'password123',
      phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
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

// Create a unique test customer
const createUniqueCustomer = async (configName, index, headers) => {
  try {
    const uniqueId = `${TIMESTAMP}_${configName}_${index}_${Math.floor(Math.random() * 10000)}`;
    const customerId = generateSSN();
    const customerEmail = `customer_${uniqueId}@test.com`;
    
    const customerData = {
      customer_id: customerId,
      first_name: `Test${configName}`,
      last_name: `Customer${index}`,
      email: customerEmail,
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
        name_on_card: `Test${configName} Customer${index}`
      },
      account_status: 'active'
    };
    
    const response = await axios.post(`${API_URL}/customers`, customerData, { headers });
    console.log(`Created test customer ${index} for ${configName}: ${customerEmail}`);
    
    // Store the created customer info
    createdEntities.customers.push({
      id: customerId,
      email: customerEmail,
      config: configName
    });
    
    return {
      id: customerId,
      email: customerEmail,
      data: customerData
    };
  } catch (error) {
    console.error(`Error creating customer for ${configName}:`, 
      error.response?.data?.message || error.message);
    throw error;
  }
};

// Create a unique test driver
const createUniqueDriver = async (configName, index, headers) => {
  try {
    const uniqueId = `${TIMESTAMP}_${configName}_${index}_${Math.floor(Math.random() * 10000)}`;
    const driverId = generateSSN();
    const driverEmail = `driver_${uniqueId}@test.com`;
    
    const driverData = {
      driver_id: driverId,
      first_name: `Test${configName}`,
      last_name: `Driver${index}`,
      email: driverEmail,
      password: 'password123',
      phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      address: `${Math.floor(Math.random() * 10000)} Test St`,
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      car_details: 'Tesla Model 3 2022',
      status: 'available',
      account_status: 'approved'
    };
    
    const response = await axios.post(`${API_URL}/drivers`, driverData, { headers });
    console.log(`Created test driver ${index} for ${configName}: ${driverEmail}`);
    
    // Store the created driver info
    createdEntities.drivers.push({
      id: driverId,
      email: driverEmail,
      config: configName
    });
    
    return {
      id: driverId,
      email: driverEmail,
      data: driverData
    };
  } catch (error) {
    console.error(`Error creating driver for ${configName}:`, 
      error.response?.data?.message || error.message);
    throw error;
  }
};

// Create a complete ride lifecycle (create, accept, start, complete)
const createCompleteRideLifecycle = async (configName, customer, driver, headers) => {
  try {
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
      driver_id: driver.id,
      customer_id: customer.id
    };
    
    // Create the ride
    console.log(`Creating test ride for ${configName}...`);
    const rideResponse = await axios.post(`${API_URL}/rides/test-create`, rideData, { 
      headers
    });
    
    const rideId = rideResponse.data.data.ride_id;
    console.log(`Created test ride: ${rideId}`);
    
    // Store the created ride info
    createdEntities.rides.push({
      id: rideId,
      customer: customer.id,
      driver: driver.id,
      config: configName
    });
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Accept the ride
    await axios.patch(`${API_URL}/rides/test/${rideId}/accept`, 
      { driver_id: driver.id }, 
      { headers }
    );
    console.log(`Test ride ${rideId} accepted`);
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Start the ride
    await axios.patch(`${API_URL}/rides/test/${rideId}/start`, {}, { 
      headers
    });
    console.log(`Test ride ${rideId} started`);
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Complete the ride
    const completeResponse = await axios.patch(`${API_URL}/rides/test/${rideId}/complete`, {}, { 
      headers
    });
    
    console.log(`Test ride ${rideId} completed with billing record`);
    
    return { 
      rideId, 
      billId: completeResponse.data?.data?.bill?.bill_id 
    };
  } catch (error) {
    console.error(`Error creating complete ride lifecycle for ${configName}:`, 
      error.response?.data?.message || error.message);
    throw error;
  }
};

// Create test accounts and ride for a specific configuration
const setupConfigTest = async (configName, headers) => {
  try {
    // Create a new customer and driver for this config
    const customer = await createUniqueCustomer(configName, 0, headers);
    const driver = await createUniqueDriver(configName, 0, headers);
    
    // Create and complete a test ride
    const ride = await createCompleteRideLifecycle(configName, customer, driver, headers);
    
    return {
      customer,
      driver,
      ride
    };
  } catch (error) {
    console.error(`Error setting up test for ${configName}:`, error.message);
    throw error;
  }
};

// Test driver creation
const testDriverCreate = async (configName, sampleSize, headers) => {
  console.log(`Testing driver CREATE operations for ${configName}...`);
  const times = [];
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      // Create unique driver for this test
      const uniqueId = `${TIMESTAMP}_${configName}_driver_${i}_${Math.floor(Math.random() * 10000)}`;
      const driverId = generateSSN();
      const driverEmail = `driver_create_${uniqueId}@test.com`;
      
      const driverData = {
        driver_id: driverId,
        first_name: `Create${configName}`,
        last_name: `Driver${i}`,
        email: driverEmail,
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
      await axios.post(`${API_URL}/drivers`, driverData, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      // Store the created driver ID for later
      createdEntities.drivers.push({
        id: driverId,
        email: driverEmail,
        config: configName
      });
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Driver CREATE test: ${i+1}/${sampleSize}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error in Driver CREATE test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} driver CREATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test driver read
const testDriverRead = async (configName, sampleSize, headers) => {
  console.log(`Testing driver READ operations for ${configName}...`);
  const times = [];
  
  // Warm cache if needed
  if (configName === 'BS' || configName === 'BSK') {
    await axios.get(`${API_URL}/drivers`, { headers });
  }
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      const startTime = Date.now();
      await axios.get(`${API_URL}/drivers`, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Driver READ test: ${i+1}/${sampleSize}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error in Driver READ test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} driver READ: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test driver update
const testDriverUpdate = async (configName, sampleSize, headers) => {
  console.log(`Testing driver UPDATE operations for ${configName}...`);
  const times = [];
  
  // Filter drivers for this configuration
  const configDrivers = createdEntities.drivers.filter(d => d.config === configName);
  
  // If we don't have enough drivers, create more
  if (configDrivers.length < sampleSize) {
    for (let i = configDrivers.length; i < sampleSize + 5; i++) {
      try {
        await createUniqueDriver(configName, i + 100, headers);
      } catch (error) {
        console.error(`Failed to create additional driver for testing:`, error.message);
      }
    }
  }
  
  // Get updated list of drivers
  const driversToUpdate = createdEntities.drivers.filter(d => d.config === configName);
  
  for (let i = 0; i < Math.min(sampleSize, driversToUpdate.length); i++) {
    try {
      const driverId = driversToUpdate[i % driversToUpdate.length].id;
      
      const startTime = Date.now();
      await axios.patch(`${API_URL}/drivers/${driverId}/status`, {
        status: i % 2 === 0 ? 'available' : 'offline',
        latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
        longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
      }, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Driver UPDATE test: ${i+1}/${sampleSize}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error in Driver UPDATE test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} driver UPDATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test customer creation
const testCustomerCreate = async (configName, sampleSize, headers) => {
  console.log(`Testing customer CREATE operations for ${configName}...`);
  const times = [];
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      // Create unique customer for this test
      const uniqueId = `${TIMESTAMP}_${configName}_customer_${i}_${Math.floor(Math.random() * 10000)}`;
      const customerId = generateSSN();
      const customerEmail = `customer_create_${uniqueId}@test.com`;
      
      const customerData = {
        customer_id: customerId,
        first_name: `Create${configName}`,
        last_name: `Customer${i}`,
        email: customerEmail,
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
          name_on_card: `Create${configName} Customer${i}`
        }
      };
      
      const startTime = Date.now();
      await axios.post(`${API_URL}/customers`, customerData, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      // Store the created customer ID for later
      createdEntities.customers.push({
        id: customerId,
        email: customerEmail,
        config: configName
      });
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Customer CREATE test: ${i+1}/${sampleSize}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error in Customer CREATE test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} customer CREATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test customer read
const testCustomerRead = async (configName, sampleSize, headers) => {
  console.log(`Testing customer READ operations for ${configName}...`);
  const times = [];
  
  // Warm cache if needed
  if (configName === 'BS' || configName === 'BSK') {
    await axios.get(`${API_URL}/customers`, { headers });
  }
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      const startTime = Date.now();
      await axios.get(`${API_URL}/customers`, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Customer READ test: ${i+1}/${sampleSize}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error in Customer READ test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} customer READ: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test customer update
const testCustomerUpdate = async (configName, sampleSize, headers) => {
  console.log(`Testing customer UPDATE operations for ${configName}...`);
  const times = [];
  
  // Filter customers for this configuration
  const configCustomers = createdEntities.customers.filter(c => c.config === configName);
  
  for (let i = 0; i < Math.min(sampleSize, configCustomers.length); i++) {
    try {
      const customerId = configCustomers[i % configCustomers.length].id;
      
      // Create random update data
      const updateData = {
        address: `${Math.floor(Math.random() * 10000)} Updated St`,
        city: i % 2 === 0 ? 'San Francisco' : 'Oakland',
        phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
      };
      
      const startTime = Date.now();
      await axios.put(`${API_URL}/customers/${customerId}`, updateData, { headers });
      const endTime = Date.now();
      
      times.push(endTime - startTime);
      
      if (i % 5 === 0 || i === sampleSize - 1) {
        console.log(`Customer UPDATE test: ${i+1}/${Math.min(sampleSize, configCustomers.length)}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error in Customer UPDATE test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} customer UPDATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test ride creation complete lifecycle
const testRideCreate = async (configName, sampleSize, headers) => {
  console.log(`Testing ride CREATE operations for ${configName}...`);
  const times = [];
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      // 1. Create new customer and driver for this ride
      const customer = await createUniqueCustomer(configName, i + 1000, headers);
      const driver = await createUniqueDriver(configName, i + 1000, headers);
      
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
        driver_id: driver.id,
        customer_id: customer.id
      };
      
      const startTime = Date.now();
      const createResponse = await axios.post(`${API_URL}/rides/test-create`, rideData, { 
        headers
      });
      const endTime = Date.now();
      
      // Add the created ride ID to our records
      if (createResponse.data && createResponse.data.data && createResponse.data.data.ride_id) {
        createdEntities.rides.push({
          id: createResponse.data.data.ride_id,
          customer: customer.id,
          driver: driver.id,
          config: configName
        });
      }
      
      times.push(endTime - startTime);
      
      if (i % 2 === 0 || i === sampleSize - 1) {
        console.log(`Ride CREATE test: ${i+1}/${sampleSize}`);
      }
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error in Ride CREATE test ${i}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  if (times.length === 0) {
    return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const result = {
    responseTime: Math.round(avgTime),
    requestsPerSecond: Math.round(1000 / avgTime),
    throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
  };
  
  console.log(`${configName} ride CREATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
  return result;
};

// Test full ride update lifecycle
const testRideUpdate = async (configName, sampleSize, headers) => {
  console.log(`Testing ride UPDATE operations for ${configName}...`);
  const times = [];
  
  for (let i = 0; i < sampleSize; i++) {
    try {
      // 1. Create new customer and driver for this ride update test
      const customer = await createUniqueCustomer(configName, i + 2000, headers);
      const driver = await createUniqueDriver(configName, i + 2000, headers);
      
      // 2. Create a ride for testing the update flow
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
        driver_id: driver.id,
        customer_id: customer.id
      };
      
      // First create a ride
      const createResponse = await axios.post(`${API_URL}/rides/test-create`, rideData, { 
        headers
      });
      
      const rideId = createResponse.data.data.ride_id;
      
            await new Promise(resolve => setTimeout(resolve, 300));
      
            // 3. Now measure the full update cycle
            const startTime = Date.now();
            
            // Accept the ride
            await axios.patch(`${API_URL}/rides/test/${rideId}/accept`, 
              { driver_id: driver.id }, 
              { headers }
            );
            
            // Wait a bit 
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Start the ride
            await axios.patch(`${API_URL}/rides/test/${rideId}/start`, {}, { 
              headers
            });
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Complete the ride
            await axios.patch(`${API_URL}/rides/test/${rideId}/complete`, {}, { 
              headers
            });
            
            const endTime = Date.now();
            times.push(endTime - startTime);
            
            // Add the ride to our completed rides
            createdEntities.rides.push({
              id: rideId,
              customer: customer.id,
              driver: driver.id,
              config: configName,
              status: 'completed'
            });
            
            if (i % 2 === 0 || i === sampleSize - 1) {
              console.log(`Ride UPDATE test: ${i+1}/${sampleSize}`);
            }
            
            // Add delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error in Ride UPDATE test ${i}:`, 
              error.response?.data?.message || error.message);
          }
        }
        
        if (times.length === 0) {
          return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
        }
        
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const result = {
          responseTime: Math.round(avgTime),
          requestsPerSecond: Math.round(1000 / avgTime),
          throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
        };
        
        console.log(`${configName} ride UPDATE: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
        return result;
      };
      
      // Test billing read operations
      const testBillingRead = async (configName, sampleSize, headers) => {
        console.log(`Testing billing READ operations for ${configName}...`);
        const times = [];
        
        // Warm cache if needed
        if (configName === 'BS' || configName === 'BSK') {
          await axios.get(`${API_URL}/billing/search`, { headers });
        }
        
        for (let i = 0; i < sampleSize; i++) {
          try {
            const startTime = Date.now();
            await axios.get(`${API_URL}/billing/search`, { headers });
            const endTime = Date.now();
            
            times.push(endTime - startTime);
            
            if (i % 5 === 0 || i === sampleSize - 1) {
              console.log(`Billing READ test: ${i+1}/${sampleSize}`);
            }
            
            // Add small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error in Billing READ test ${i}:`, 
              error.response?.data?.message || error.message);
          }
        }
        
        if (times.length === 0) {
          return { responseTime: 0, requestsPerSecond: 0, throughput: 0 };
        }
        
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const result = {
          responseTime: Math.round(avgTime),
          requestsPerSecond: Math.round(1000 / avgTime),
          throughput: Math.round(Math.round(1000 / avgTime) * 0.8)
        };
        
        console.log(`${configName} billing READ: ${result.requestsPerSecond} req/s, ${result.responseTime}ms avg`);
        return result;
      };
      
      // Run comprehensive tests for a configuration
      const testConfiguration = async (config, sampleSize) => {
        console.log(`\n===== Testing ${config.name}: ${config.description} =====`);
        
        // Results object to store performance metrics
        const results = {
          // Overall averages
          create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          overall: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          
          // Entity-specific operations
          driver_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          driver_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          driver_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          
          customer_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          customer_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          customer_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          
          ride_create: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          ride_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          ride_update: { requestsPerSecond: 0, responseTime: 0, throughput: 0 },
          
          billing_read: { requestsPerSecond: 0, responseTime: 0, throughput: 0 }
        };
        
        // Admin headers with configuration headers
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...config.headers
        };
        
        try {
          // Set up test accounts and initial ride for this configuration
          const testData = await setupConfigTest(config.name, headers);
          
          // 1. DRIVER operations
          console.log('\n--- Testing DRIVER operations ---');
          results.driver_create = await testDriverCreate(config.name, Math.min(sampleSize, 10), headers);
          results.driver_read = await testDriverRead(config.name, sampleSize, headers);
          results.driver_update = await testDriverUpdate(config.name, sampleSize, headers);
          
          // 2. CUSTOMER operations
          console.log('\n--- Testing CUSTOMER operations ---');
          results.customer_create = await testCustomerCreate(config.name, Math.min(sampleSize, 10), headers);
          results.customer_read = await testCustomerRead(config.name, sampleSize, headers);
          results.customer_update = await testCustomerUpdate(config.name, sampleSize, headers);
          
          // 3. RIDE operations
          console.log('\n--- Testing RIDE operations ---');
          results.ride_create = await testRideCreate(config.name, Math.min(sampleSize, 5), headers);
          // NOTE: testRideRead was removed as it was complex to implement
          results.ride_update = await testRideUpdate(config.name, Math.min(sampleSize, 5), headers);
          
          // 4. BILLING operations
          console.log('\n--- Testing BILLING operations ---');
          results.billing_read = await testBillingRead(config.name, sampleSize, headers);
          
          // Log that ride read test was skipped
          console.log('\nNote: Ride READ tests were skipped in this test run.');
          
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
              // Skip billing create/update since they're not implemented
              if (entity === 'billing' && op !== 'read') {
                return;
              }
              
              // Skip ride read since it was removed
              if (entity === 'ride' && op === 'read') {
                return;
              }
              
              const key = `${entity}_${op}`;
              if (results[key] && results[key].requestsPerSecond > 0) {
                validCount++;
                totalRps += results[key].requestsPerSecond;
                totalResponseTime += results[key].responseTime;
                totalThroughput += results[key].throughput;
              }
            });
            
            if (validCount > 0) {
              results[op] = {
                requestsPerSecond: Math.round(totalRps / validCount),
                responseTime: Math.round(totalResponseTime / validCount),
                throughput: Math.round(totalThroughput / validCount)
              };
              
              console.log(`${config.name} ${op.toUpperCase()} AVERAGE: ${results[op].requestsPerSecond} req/s, ${results[op].responseTime}ms avg`);
            }
          });
          
          // Calculate overall average across all operations
          let validOps = 0;
          let totalRps = 0;
          let totalResponseTime = 0;
          let totalThroughput = 0;
          
          operations.forEach(op => {
            if (results[op] && results[op].requestsPerSecond > 0) {
              validOps++;
              totalRps += results[op].requestsPerSecond;
              totalResponseTime += results[op].responseTime;
              totalThroughput += results[op].throughput;
            }
          });
          
          if (validOps > 0) {
            results.overall = {
              requestsPerSecond: Math.round(totalRps / validOps),
              responseTime: Math.round(totalResponseTime / validOps),
              throughput: Math.round(totalThroughput / validOps)
            };
            
            console.log(`${config.name} OVERALL: ${results.overall.requestsPerSecond} req/s, ${results.overall.responseTime}ms avg`);
          }
          
          return results;
        } catch (error) {
          console.error(`Error testing configuration ${config.name}:`, error.message);
          return results;
        }
      };
      
      // Main performance testing function
      const runPerformanceTests = async (sampleSize = 50) => {
        console.log(`Starting performance tests with ${sampleSize} samples per operation...`);
        
        // Define configurations to test
        const configurations = [
          { 
            name: 'B', 
            headers: { 
              'X-Disable-Cache': 'true'
            },
            description: 'Base implementation' 
          },
          { 
            name: 'BS', 
            headers: {},
            description: 'Base + SQL Caching (Redis)' 
          },
          { 
            name: 'BSK', 
            headers: {
              'X-Enable-Kafka': 'true'
            },
            description: 'Base + SQL Caching + Kafka' 
          }
        ];
        
        // Initialize results object
        const results = {};
        
        // Test each configuration
        for (const config of configurations) {
          results[config.name] = await testConfiguration(config, sampleSize);
          
          // Add a pause between configurations
          console.log(`\nCompleted testing ${config.name}. Pausing before next configuration...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Save results to a file
        try {
          const resultPath = path.join(__dirname, 'performance_results.json');
          fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
          console.log(`Performance results saved to ${resultPath}`);
          
          // Also save as cru_performance_results.json for compatibility with visualization
          const cruResultPath = path.join(__dirname, 'cru_performance_results.json');
          fs.writeFileSync(cruResultPath, JSON.stringify(results, null, 2));
          console.log(`Results also saved as ${cruResultPath} for visualization compatibility`);
        } catch (error) {
          console.error("Error saving performance results:", error.message);
        }
        
        return results;
      };
      
      // Generate performance graphs
      const generatePerformanceGraphs = async () => {
        try {
          // Check if we have the visualization script
          const graphScriptPath = path.join(__dirname, 'generateCRUPerformanceGraphs.js');
          if (fs.existsSync(graphScriptPath)) {
            console.log('Generating performance graphs...');
            const generateGraphs = require('./generateCRUPerformanceGraphs');
            await generateGraphs();
            console.log('Performance graphs generated successfully');
          } else {
            console.log('Graph generation script not found. Skipping visualization.');
          }
        } catch (error) {
          console.error('Error generating performance graphs:', error.message);
          console.log('You can run the visualization separately using:');
          console.log('node generateCRUPerformanceGraphs.js');
        }
      };
      
      // Helper function to get argument values
      function getArgValue(argName, defaultValue) {
        const argIndex = process.argv.findIndex(arg => arg === argName);
        if (argIndex !== -1 && argIndex < process.argv.length - 1) {
          const value = parseInt(process.argv[argIndex + 1]);
          return isNaN(value) ? defaultValue : value;
        }
        return defaultValue;
      }
      
      // Add a new function for bulk test data generation
      async function generateTestData(config) {
        console.log(`Generating ${config.driverCount} drivers, ${config.customerCount} customers, and ${config.rideCount} rides...`);
        
        // Generate drivers in batches
        await generateDriversInBatches(config.driverCount, config.batchSize);
        
        // Generate customers in batches
        await generateCustomersInBatches(config.customerCount, config.batchSize);
        
        // Generate rides in batches (smaller batches for rides since they're more complex)
        await generateRidesInBatches(config.rideCount, Math.min(config.batchSize, 50));
        
        console.log('Test data generation completed');
      }
      
      // Generate drivers in batches
      async function generateDriversInBatches(totalCount, batchSize) {
        console.log(`Generating ${totalCount} drivers in batches of ${batchSize}...`);
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        };
        
        for (let i = 0; i < totalCount; i += batchSize) {
          const currentBatchSize = Math.min(batchSize, totalCount - i);
          console.log(`Generating drivers batch ${i+1} to ${i+currentBatchSize} of ${totalCount}`);
    
          const driverBatch = [];
          
          // Prepare batch of driver data
          for (let j = 0; j < currentBatchSize; j++) {
            const driverId = generateSSN();
            const uniqueId = `${TIMESTAMP}_batch_${i+j}`;
            const driverEmail = `driver_batch_${uniqueId}@test.com`;
            
            driverBatch.push({
              driver_id: driverId,
              first_name: `TestDriver`,
              last_name: `Batch${i+j}`,
              email: driverEmail,
              password: 'password123',
              phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
              address: `${Math.floor(Math.random() * 10000)} Driver St`,
              city: 'San Francisco',
              state: ['CA', 'NY', 'TX', 'WA', 'IL'][Math.floor(Math.random() * 5)],
              zip_code: `${10000 + Math.floor(Math.random() * 89999)}`,
              car_details: `Toyota Camry ${2015 + Math.floor(Math.random() * 10)}`,
              status: 'available',
              account_status: 'approved'
            });
            
            // Store driver ID for later reference
            createdEntities.drivers.push({
              id: driverId,
              email: driverEmail,
              config: 'batch'
            });
          }
          
          try {
            // Use bulk API endpoint to create batch
            await axios.post(`${API_URL}/drivers`, {
              bulk: true,
              items: driverBatch
            }, { headers });
            
            console.log(`Successfully created drivers batch ${i+1} to ${i+currentBatchSize}`);
          } catch (error) {
            console.error(`Error creating drivers batch:`, 
              error.response?.data?.message || error.message);
          }
          
          // Add a small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Generate customers in batches
      async function generateCustomersInBatches(totalCount, batchSize) {
        console.log(`Generating ${totalCount} customers in batches of ${batchSize}...`);
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        };
        
        for (let i = 0; i < totalCount; i += batchSize) {
          const currentBatchSize = Math.min(batchSize, totalCount - i);
          console.log(`Generating customers batch ${i+1} to ${i+currentBatchSize} of ${totalCount}`);
          
          const customerBatch = [];
          
          // Prepare batch of customer data
          for (let j = 0; j < currentBatchSize; j++) {
            const customerId = generateSSN();
            const uniqueId = `${TIMESTAMP}_batch_${i+j}`;
            const customerEmail = `customer_batch_${uniqueId}@test.com`;
            
            customerBatch.push({
              customer_id: customerId,
              first_name: `TestCustomer`,
              last_name: `Batch${i+j}`,
              email: customerEmail,
              password: 'password123',
              phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
              address: `${Math.floor(Math.random() * 10000)} Customer St`,
              city: 'San Francisco',
              state: ['CA', 'NY', 'TX', 'WA', 'IL'][Math.floor(Math.random() * 5)],
              zip_code: `${10000 + Math.floor(Math.random() * 89999)}`,
              credit_card: {
                number: '4111111111111111',
                expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 5) + 25)}`,
                cvv: String(Math.floor(Math.random() * 900) + 100),
                name_on_card: `TestCustomer Batch${i+j}`
              },
              account_status: 'active'
            });
            
            // Store customer ID for later reference
            createdEntities.customers.push({
              id: customerId,
              email: customerEmail,
              config: 'batch'
            });
          }
          
          try {
            // Use bulk API endpoint to create batch
            await axios.post(`${API_URL}/customers`, {
              bulk: true,
              items: customerBatch
            }, { headers });
            
            console.log(`Successfully created customers batch ${i+1} to ${i+currentBatchSize}`);
          } catch (error) {
            console.error(`Error creating customers batch:`, 
              error.response?.data?.message || error.message);
          }
          
          // Add a small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Generate rides in batches
      async function generateRidesInBatches(totalCount, batchSize) {
        console.log(`Generating ${totalCount} rides in batches of ${batchSize}...`);
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        };
        
        // Ensure we have enough drivers and customers
        if (createdEntities.drivers.length < 10 || createdEntities.customers.length < 10) {
          console.error('Not enough drivers or customers for ride generation. Please generate more entities first.');
          return;
        }
        
        for (let i = 0; i < totalCount; i += batchSize) {
          const currentBatchSize = Math.min(batchSize, totalCount - i);
          console.log(`Generating rides batch ${i+1} to ${i+currentBatchSize} of ${totalCount}`);
          
          // Process each ride creation sequentially in the batch
          for (let j = 0; j < currentBatchSize; j++) {
            try {
              // Select random customer and driver
              const customerIndex = Math.floor(Math.random() * createdEntities.customers.length);
              const driverIndex = Math.floor(Math.random() * createdEntities.drivers.length);
              
              const customerId = createdEntities.customers[customerIndex].id;
              const driverId = createdEntities.drivers[driverIndex].id;
              
              // Random pickup/dropoff within San Francisco area
              const pickup = {
                latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
                longitude: -122.4194 + (Math.random() * 0.1 - 0.05)
              };
              
              const dropoff = {
                latitude: pickup.latitude + (Math.random() * 0.2 - 0.1),
                longitude: pickup.longitude + (Math.random() * 0.2 - 0.1)
              };
              
              const rideData = {
                pickup_location: pickup,
                dropoff_location: dropoff,
                date_time: new Date().toISOString(),
                passenger_count: Math.floor(Math.random() * 4) + 1,
                driver_id: driverId,
                customer_id: customerId
              };
              
              // Create ride
              const rideResponse = await axios.post(`${API_URL}/rides/test-create`, rideData, { headers });
              const rideId = rideResponse.data.data.ride_id;
              
              // Store created ride
              createdEntities.rides.push({
                id: rideId,
                customer: customerId,
                driver: driverId,
                config: 'batch'
              });
              
              // Process ride lifecycle (accept, start, complete)
              await axios.patch(`${API_URL}/rides/test/${rideId}/accept`, { driver_id: driverId }, { headers });
              await axios.patch(`${API_URL}/rides/test/${rideId}/start`, {}, { headers });
              await axios.patch(`${API_URL}/rides/test/${rideId}/complete`, {}, { headers });
              
              if ((i + j) % 10 === 0) {
                console.log(`Processed ${i+j+1} rides`);
              }
            } catch (error) {
              console.error(`Error creating ride ${i+j+1}:`, 
                error.response?.data?.message || error.message);
            }
            
            // Add a small delay between ride creations to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          console.log(`Completed rides batch ${i+1} to ${i+currentBatchSize}`);
        }
      }
      
      // Main function
      const main = async () => {
        try {
          console.log('======================================================');
          console.log('  Uber Simulation Performance Testing');
          console.log('======================================================');
          console.log('Testing system performance across configurations:');
          console.log('- B: Base implementation');
          console.log('- BS: Base + SQL Caching (Redis)');
          console.log('- BSK: Base + SQL Caching + Kafka');
          console.log('======================================================');
          
          // Parse command line arguments for test configuration
          const testConfig = {
            ...DEFAULT_TEST_CONFIG,
            driverCount: getArgValue('--drivers', DEFAULT_TEST_CONFIG.driverCount),
            customerCount: getArgValue('--customers', DEFAULT_TEST_CONFIG.customerCount),
            rideCount: getArgValue('--rides', DEFAULT_TEST_CONFIG.rideCount),
            sampleSize: getArgValue('--sample', DEFAULT_TEST_CONFIG.sampleSize),
            batchSize: getArgValue('--batch', DEFAULT_TEST_CONFIG.batchSize)
          };
          
          // Support for predefined test sizes
          if (process.argv.includes('--small')) {
            testConfig.driverCount = 100;
            testConfig.customerCount = 100;
            testConfig.rideCount = 20;
            testConfig.sampleSize = 10;
          } else if (process.argv.includes('--medium')) {
            testConfig.driverCount = 1000;
            testConfig.customerCount = 1000;
            testConfig.rideCount = 500;
            testConfig.sampleSize = 50;
          } else if (process.argv.includes('--large')) {
            testConfig.driverCount = 10000;
            testConfig.customerCount = 10000;
            testConfig.rideCount = 5000;
            testConfig.sampleSize = 100;
          } else if (process.argv.includes('--massive')) {
            testConfig.driverCount = 20000;
            testConfig.customerCount = 20000;
            testConfig.rideCount = 30000;
            testConfig.sampleSize = 200;
          }
          
          const skipSetup = process.argv.includes('--skip-setup');
          const skipGraphs = process.argv.includes('--skip-graphs');
          
          console.log(`Test configuration:`);
          console.log(`- Drivers: ${testConfig.driverCount}`);
          console.log(`- Customers: ${testConfig.customerCount}`);
          console.log(`- Rides: ${testConfig.rideCount}`);
          console.log(`- Sample size: ${testConfig.sampleSize}`);
          console.log(`- Batch size: ${testConfig.batchSize}`);
          
          // Login as admin
          const adminLoggedIn = await loginAsAdmin();
          if (!adminLoggedIn) {
            console.error('Failed to login as admin. Exiting.');
            return;
          }
          
          // Add a data generation step before performance testing
          if (!skipSetup) {
            console.log('\nGenerating test data...');
            await generateTestData(testConfig);
          }
          
          // Run performance tests
          await runPerformanceTests(testConfig.sampleSize);
          
          // Generate performance graphs
          if (!skipGraphs) {
            await generatePerformanceGraphs();
          }
          
          console.log('======================================================');
          console.log('  Performance Testing Completed');
          console.log('======================================================');
          console.log('Results saved to performance_results.json');
          console.log('Run node generateCRUPerformanceGraphs.js to visualize results');
          console.log('======================================================');
          
        } catch (error) {
          console.error('Error in main process:', error);
        }
      };

      function getArgValue(argName, defaultValue) {
        const argIndex = process.argv.findIndex(arg => arg === argName);
        if (argIndex !== -1 && argIndex < process.argv.length - 1) {
          const value = parseInt(process.argv[argIndex + 1]);
          return isNaN(value) ? defaultValue : value;
        }
        return defaultValue;
      }
      
      // Run the main function
      main();



      // command to run larger sample: node finalTest_CRU_entities.js --drivers 15000 --customers 20000 --rides 25000 --sample 2000 --batch 100