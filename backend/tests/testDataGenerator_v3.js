// testDataGenerator.js - Improved version
const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';
let TEST_CUSTOMER_TOKEN = '';
let TEST_DRIVER_TOKEN = '';
let TEST_CUSTOMER_ID = '';
let TEST_DRIVER_ID = '';

// Helper functions
const generateSSN = () => {
  const part1 = String(Math.floor(Math.random() * 900) + 100);
  const part2 = String(Math.floor(Math.random() * 90) + 10);
  const part3 = String(Math.floor(Math.random() * 9000) + 1000);
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
      return loginAsAdmin(); // Try logging in again after creating admin
    }
    
    return false;
  }
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

// Create test accounts that will be used for JMeter and for creating the initial rides
const createTestAccounts = async () => {
  try {
    // Create a test customer
    const customerId = generateSSN();
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
    await axios.post(`${API_URL}/customers`, customerData, { headers });
    console.log('Created test customer:', customerEmail);
    
    // Login as customer
    const customerLoginResponse = await axios.post(`${API_URL}/auth/customer/login`, {
      email: customerEmail,
      password: 'password123',
      role: 'customer'
    });
    
    TEST_CUSTOMER_TOKEN = customerLoginResponse.data.token;
    console.log('Test customer logged in successfully');
    
    // Create a test driver
    const driverId = generateSSN();
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
    await axios.post(`${API_URL}/drivers`, driverData, { headers });
    console.log('Created test driver:', driverEmail);
    
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

// Generate drivers
const generateDrivers = async (count) => {
  console.log(`Generating ${count} drivers...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const carMakers = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Mercedes', 'Audi', 'Tesla'];
  const carModels = ['Camry', 'Accord', 'Fusion', 'Malibu', 'Altima', 'Sonata', 'X5', 'E-Class', 'A4', 'Model 3'];
  
  const drivers = [];
  
  for (let i = 0; i < count; i++) {
    const driver_id = generateSSN();
    const first_name = `Driver${i}`;
    const last_name = `Test${Math.floor(Math.random() * 10000)}`;
    const email = `driver${i}@test.com`;
    
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
    
    // Log progress
    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1} drivers`);
    }
  }
  
  return drivers;
};

// Generate customers
const generateCustomers = async (count) => {
  console.log(`Generating ${count} customers...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const customer_id = generateSSN();
    const first_name = `Customer${i}`;
    const last_name = `Test${Math.floor(Math.random() * 10000)}`;
    const email = `customer${i}@test.com`;
    
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
    
    // Log progress
    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1} customers`);
    }
  }
  
  return customers;
};

// Bulk insert data with retry logic and better error handling
const bulkInsert = async (endpoint, data, batchSize = 100) => {
  console.log(`Inserting ${data.length} records to ${endpoint}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    
    while (!success && retryCount < maxRetries) {
      try {
        const response = await axios.post(`${API_URL}/${endpoint}`, {
          bulk: true,
          items: batch
        }, { headers });
        
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} - Status: ${response.status}`);
        success = true;
      } catch (error) {
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`Batch ${Math.floor(i / batchSize) + 1} failed, retrying (${retryCount}/${maxRetries})...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        } else {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1} after ${maxRetries} retries:`, error.response?.data?.message || error.message);
          
          // Try single insert if bulk fails
          if (error.response?.status === 400 || error.response?.status === 413) {
            console.log("Falling back to individual inserts for this batch...");
            let successCount = 0;
            
            for (const item of batch) {
              try {
                await axios.post(`${API_URL}/${endpoint}`, item, { headers });
                successCount++;
                
                // Log progress every 10 items
                if (successCount % 10 === 0) {
                  console.log(`Inserted ${successCount}/${batch.length} individual items in this batch`);
                }
              } catch (itemError) {
                // Only log the first few errors to avoid console flood
                if (successCount < 5) {
                  console.error(`Failed to insert individual item:`, itemError.response?.data?.message || itemError.message);
                }
              }
              
              // Add a small delay between individual inserts
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            console.log(`Completed individual inserts for batch: ${successCount}/${batch.length} successful`);
          }
        }
      }
    }
    
    // Add a delay between batches regardless of success to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// Create rides and their lifecycle with improved error handling and retries
const createRidesAndBills = async (count) => {
  console.log(`Creating ${count} test rides and bills...`);
  
  let successfulRides = 0;
  let successfulBills = 0;
  let failedRides = 0;
  let failedBills = 0;
  
  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_CUSTOMER_TOKEN}`
  };
  
  const driverHeaders = {
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${TEST_DRIVER_TOKEN}`
  };
  
  for (let i = 0; i < count; i++) {
    try {
      // Step 1: Create a ride as customer
      const pickup = {
        latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
        longitude: -122.4194 + (Math.random() * 0.05 - 0.025)
      };
      
      const dropoff = {
        latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
        longitude: -122.4194 + (Math.random() * 0.1 - 0.05)
      };
      
      const rideData = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        date_time: new Date().toISOString(),
        passenger_count: Math.floor(Math.random() * 4) + 1,
        driver_id: TEST_DRIVER_ID
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
          
          console.log(`Created ride ${i+1}/${count} - ID: ${rideId}`);
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2: Accept ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/accept`, {}, { headers: driverHeaders });
        console.log(`Driver accepted ride ${i+1}/${count}`);
      } catch (error) {
        console.error(`Error accepting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue; // Skip to next ride if accept failed
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Start ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/start`, {}, { headers: driverHeaders });
        console.log(`Driver started ride ${i+1}/${count}`);
      } catch (error) {
        console.error(`Error starting ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 4: Complete ride as driver
      try {
        await axios.patch(`${API_URL}/rides/${rideId}/complete`, {}, { headers: driverHeaders });
        console.log(`Driver completed ride ${i+1}/${count}`);
      } catch (error) {
        console.error(`Error completing ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 5: Create bill as driver
      const billData = {
        ride_id: rideId
      };
      
      try {
        await axios.post(`${API_URL}/billing`, billData, { headers: driverHeaders });
        successfulBills++;
        console.log(`Created bill for ride ${i+1}/${count}`);
      } catch (error) {
        failedBills++;
        console.error(`Error creating bill for ride ${i+1}/${count}:`, error.response?.data?.message || error.message);
      }
      
      // Random delay to mimic natural patterns and prevent rate-limiting
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    } catch (error) {
      console.error(`Unexpected error in ride/bill creation (${i+1}/${count}):`, error.message);
    }
  }
  
  console.log(`Successfully created ${successfulRides} rides and ${successfulBills} bills`);
  console.log(`Failed to create ${failedRides} rides and ${failedBills} bills`);
  return { rides: successfulRides, bills: successfulBills };
};

// Main function with support for smaller test runs via command line args
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
    
    // Target numbers for performance testing
    let targetDrivers, targetCustomers, targetRides;
    
    // Check if arguments were provided for smaller test
    if (process.argv.includes('--small')) {
      targetDrivers = 500;
      targetCustomers = 500;
      targetRides = 200;
      console.log('Running small test data generation');
    } else {
      // Full dataset for performance testing
      targetDrivers = 10000;  // 10,000 as per project requirements
      targetCustomers = 10000; // 10,000 as per project requirements
      targetRides = 1000;     // Create 1000 rides and bills as a starter set
      console.log('Running full test data generation (10,000 drivers/customers)');
    }
    
    // Generate and insert drivers in batches
    const batchSize = 1000;
    for (let i = 0; i < targetDrivers; i += batchSize) {
      const count = Math.min(batchSize, targetDrivers - i);
      const drivers = await generateDrivers(count);
      await bulkInsert('drivers', drivers, 100); // Smaller batch size for more reliable insertion
      console.log(`Progress: ${Math.min(i + batchSize, targetDrivers)}/${targetDrivers} drivers inserted`);
    }
    
    // Generate and insert customers in batches
    for (let i = 0; i < targetCustomers; i += batchSize) {
      const count = Math.min(batchSize, targetCustomers - i);
      const customers = await generateCustomers(count);
      await bulkInsert('customers', customers, 100); // Smaller batch size for more reliable insertion
      console.log(`Progress: ${Math.min(i + batchSize, targetCustomers)}/${targetCustomers} customers inserted`);
    }
    
    // Create test rides and bills
    await createRidesAndBills(targetRides);
    
    console.log('=== DATA GENERATION COMPLETE ===');
    console.log(`Generated approximately:`);
    console.log(`- ${targetDrivers} drivers`);
    console.log(`- ${targetCustomers} customers`);
    console.log(`- ${targetRides} rides/bills (approx)`);
    console.log('\nTest accounts created for JMeter:');
    console.log(' - Customer: test_customer@test.com / password123');
    console.log(' - Driver: test_driver@test.com / password123');
    console.log(' - Admin: admin@test.com / password123');
    console.log('\nYou can now run JMeter tests using the fixed performanceTest.jmx file');
    
  } catch (error) {
    console.error('Error in data generation:', error);
  }
};

// Run the main function
main();