// testDataGenerator.js
const axios = require('axios');
const fs = require('fs');

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

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate a random location within a bounding box (San Francisco area)
const getRandomLocation = () => {
  // San Francisco bounding box
  const minLat = 37.70;
  const maxLat = 37.83;
  const minLng = -122.52;
  const maxLng = -122.35;
  
  return {
    latitude: minLat + Math.random() * (maxLat - minLat),
    longitude: minLng + Math.random() * (maxLng - minLng)
  };
};

// Generate drivers (fewer to start with for testing)
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
      state: getRandomElement(states),
      zip_code: String(Math.floor(Math.random() * 90000) + 10000),
      car_details: `${getRandomElement(carMakers)} ${getRandomElement(carModels)} ${2015 + Math.floor(Math.random() * 10)}`
    };
    
    drivers.push(driver);
    
    // Log progress
    if ((i + 1) % 10 === 0) {
      console.log(`Generated ${i + 1} drivers`);
    }
  }
  
  return drivers;
};

// Generate customers (fewer to start with for testing)
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
      state: getRandomElement(states),
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
    if ((i + 1) % 10 === 0) {
      console.log(`Generated ${i + 1} customers`);
    }
  }
  
  return customers;
};

// Updated bulkInsert function with better debugging
const bulkInsert = async (endpoint, data, batchSize = 10) => {
    console.log(`Inserting ${data.length} records to ${endpoint}...`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
    
    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        // Debug: Log the first item in each batch to check format
        if (batch.length > 0) {
          console.log(`Sample ${endpoint} item:`, 
            JSON.stringify({
              id: batch[0][`${endpoint.slice(0, -1)}_id`], // e.g., driver_id or customer_id
              name: `${batch[0].first_name} ${batch[0].last_name}`
            })
          );
        }
        
        // Try with individual inserts instead of bulk if there's an issue
        if (i === 0) { // Try single insert for the first item as a test
          console.log(`Testing single insert for ${endpoint}...`);
          const singleResponse = await axios.post(
            `${API_URL}/${endpoint}`, 
            batch[0], 
            { headers }
          );
          console.log(`Single insert result:`, singleResponse.status);
        }
        
        // Now try the bulk insert
        const response = await axios.post(`${API_URL}/${endpoint}`, {
          bulk: true,
          items: batch
        }, { headers });
        
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} - Status: ${response.status}`);
      } catch (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.response?.data?.message || error.message);
        
        // Debug: Log the first problematic item
        if (batch.length > 0) {
          console.log(`Problematic ${endpoint.slice(0, -1)}_id:`, batch[0][`${endpoint.slice(0, -1)}_id`]);
        }
        
        // Check if middleware is configured to handle bulk requests
        console.log(`Check if your server has a bulkRequestMiddleware configured for ${endpoint}`);
      }
      
      // Add a small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

// Main function
const main = async () => {
  try {
    // Login to get admin token (will create admin if needed)
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Failed to login or create admin account. Exiting.');
      return;
    }
    
    // Start with smaller numbers for initial testing
    const drivers = await generateDrivers(50);
    const customers = await generateCustomers(50);
    
    // Bulk insert data
    await bulkInsert('drivers', drivers);
    await bulkInsert('customers', customers);
    
    console.log('Initial data generation and insertion complete!');
    console.log('To continue with more data, update the counts in the script.');
  } catch (error) {
    console.error('Error in data generation:', error);
  }
};

main();