// testDataPerformance.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';

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
      status: 'available'  // Set all drivers to available
    };
    
    drivers.push(driver);
    
    // Log progress
    if ((i + 1) % 100 === 0) {
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
      }
    };
    
    customers.push(customer);
    
    // Log progress
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1} customers`);
    }
  }
  
  return customers;
};

// Bulk insert data
const bulkInsert = async (endpoint, data, batchSize = 100) => {
  console.log(`Inserting ${data.length} records to ${endpoint}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  };
  
  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const response = await axios.post(`${API_URL}/${endpoint}`, {
        bulk: true,
        items: batch
      }, { headers });
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} - Status: ${response.status}`);
    } catch (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.response?.data?.message || error.message);
      
      // Try single insert if bulk fails
      if (error.response?.data?.message?.includes("bulk")) {
        console.log("Falling back to individual inserts...");
        for (const item of batch) {
          try {
            await axios.post(`${API_URL}/${endpoint}`, item, { headers });
            console.log(`Inserted individual item`);
          } catch (itemError) {
            console.error(`Failed to insert individual item:`, itemError.response?.data?.message || itemError.message);
          }
          
          // Add a small delay between individual inserts
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    // Add a small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// Create a test customer account for JMeter
const createTestCustomer = async () => {
  try {
    const customerData = {
      customer_id: generateSSN(),
      first_name: 'JMeter',
      last_name: 'TestCustomer',
      email: 'jmeter_customer@test.com',
      password: 'password123',
      phone: '555-1234567',
      address: '123 JMeter St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      credit_card: {
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123',
        name_on_card: 'JMeter TestCustomer'
      }
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    await axios.post(`${API_URL}/customers`, customerData, { headers });
    console.log('Created JMeter test customer: jmeter_customer@test.com / password123');
    return true;
  } catch (error) {
    console.error('Error creating JMeter test customer:', error.response?.data?.message || error.message);
    return false;
  }
};

// Create a test driver account for JMeter
const createTestDriver = async () => {
  try {
    const driverData = {
      driver_id: generateSSN(),
      first_name: 'JMeter',
      last_name: 'TestDriver',
      email: 'jmeter_driver@test.com',
      password: 'password123',
      phone: '555-7654321',
      address: '456 JMeter St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      car_details: 'Toyota Camry 2020',
      status: 'available'
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    await axios.post(`${API_URL}/drivers`, driverData, { headers });
    console.log('Created JMeter test driver: jmeter_driver@test.com / password123');
    return true;
  } catch (error) {
    console.error('Error creating JMeter test driver:', error.response?.data?.message || error.message);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    // Login to get admin token
    const loggedIn = await loginAsAdmin();
    if (!loggedIn) {
      console.error('Failed to login or create admin account. Exiting.');
      return;
    }
    
    // Target numbers for performance testing
    const targetDrivers = 10000;  // 10,000 as per project requirements
    const targetCustomers = 10000; // 10,000 as per project requirements
    
    // Generate and insert drivers in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < targetDrivers; i += batchSize) {
      const count = Math.min(batchSize, targetDrivers - i);
      const drivers = await generateDrivers(count);
      await bulkInsert('drivers', drivers);
      console.log(`Progress: ${Math.min(i + batchSize, targetDrivers)}/${targetDrivers} drivers inserted`);
    }
    
    // Generate and insert customers in batches of 1000
    for (let i = 0; i < targetCustomers; i += batchSize) {
      const count = Math.min(batchSize, targetCustomers - i);
      const customers = await generateCustomers(count);
      await bulkInsert('customers', customers);
      console.log(`Progress: ${Math.min(i + batchSize, targetCustomers)}/${targetCustomers} customers inserted`);
    }
    
    // Create test accounts for JMeter
    await createTestCustomer();
    await createTestDriver();
    
    console.log('=== DATA GENERATION COMPLETE ===');
    console.log(`${targetDrivers} drivers inserted`);
    console.log(`${targetCustomers} customers inserted`);
    console.log('JMeter test accounts created');
    console.log('You can now run JMeter tests using the performanceTest.jmx file');
    
  } catch (error) {
    console.error('Error in data generation:', error);
  }
};

// Run the main function
main();