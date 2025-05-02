// testDataGenerator_v2.js
const axios = require('axios');
const fs = require('fs');

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

// Generate a date within the last year
const getRandomDate = () => {
  const now = new Date();
  const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const timestamp = pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime());
  return new Date(timestamp).toISOString();
};

// Generate drivers
const generateDrivers = async (count, startIndex = 0) => {
  console.log(`Generating ${count} drivers (starting at index ${startIndex})...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const carMakers = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Mercedes', 'Audi', 'Tesla'];
  const carModels = ['Camry', 'Accord', 'Fusion', 'Malibu', 'Altima', 'Sonata', 'X5', 'E-Class', 'A4', 'Model 3'];
  
  const drivers = [];
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const driver_id = generateSSN();
    const first_name = `Driver${idx}`;
    const last_name = `Test${Math.floor(Math.random() * 10000)}`;
    const email = `driver${idx}@test.com`;
    
    const location = getRandomLocation();
    
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
      car_details: `${getRandomElement(carMakers)} ${getRandomElement(carModels)} ${2015 + Math.floor(Math.random() * 10)}`,
      status: getRandomElement(['available', 'busy', 'offline']),
      intro_media: {
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      }
    };
    
    drivers.push(driver);
    
    // Log progress
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1} drivers (total: ${startIndex + i + 1})`);
    }
  }
  
  return drivers;
};

// Generate customers
const generateCustomers = async (count, startIndex = 0) => {
  console.log(`Generating ${count} customers (starting at index ${startIndex})...`);
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const customer_id = generateSSN();
    const first_name = `Customer${idx}`;
    const last_name = `Test${Math.floor(Math.random() * 10000)}`;
    const email = `customer${idx}@test.com`;
    
    const location = getRandomLocation();
    
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
      },
      last_location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    };
    
    customers.push(customer);
    
    // Log progress
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1} customers (total: ${startIndex + i + 1})`);
    }
  }
  
  return customers;
};

// Generate rides
const generateRides = async (count, drivers, customers, startIndex = 0) => {
  console.log(`Generating ${count} rides (starting at index ${startIndex})...`);
  
  const rides = [];
  const statuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
  const statusWeights = [0.05, 0.1, 0.05, 0.7, 0.1]; // Probability distribution
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const ride_id = generateSSN();
    const customer = getRandomElement(customers);
    const driver = getRandomElement(drivers);
    
    const pickup = getRandomLocation();
    const dropoff = getRandomLocation();
    
    // Calculate a random status based on weights
    let status;
    const random = Math.random();
    let cumulativeWeight = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulativeWeight += statusWeights[j];
      if (random <= cumulativeWeight) {
        status = statuses[j];
        break;
      }
    }
    
    // Calculate distance (simplified)
    const lat1 = pickup.latitude;
    const lon1 = pickup.longitude;
    const lat2 = dropoff.latitude;
    const lon2 = dropoff.longitude;
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    // Calculate duration (simplified - assume 30 km/h average speed)
    const duration = distance / 30 * 60; // Duration in minutes
    
    // Calculate fare (simplified)
    const baseFare = 3.0;
    const distanceFare = distance * 1.5;
    const timeFare = duration * 0.2;
    const surge = 1 + Math.random() * 0.5; // Random surge between 1.0 and 1.5
    const fareAmount = ((baseFare + distanceFare + timeFare) * surge).toFixed(2);
    
    const ride = {
      ride_id,
      pickup_location: pickup,
      dropoff_location: dropoff,
      date_time: getRandomDate(),
      customer_id: customer.customer_id,
      driver_id: driver.driver_id,
      fare_amount: parseFloat(fareAmount),
      passenger_count: Math.floor(Math.random() * 4) + 1,
      status,
      distance,
      duration
    };
    
    // Add ratings if ride is completed
    if (status === 'completed') {
      ride.rating = {
        customer_to_driver: Math.floor(Math.random() * 5) + 1,
        driver_to_customer: Math.floor(Math.random() * 5) + 1
      };
    }
    
    rides.push(ride);
    
    // Log progress
    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1} rides (total: ${startIndex + i + 1})`);
    }
  }
  
  return rides;
};

// Generate bills
const generateBills = async (rides) => {
  console.log(`Generating bills for ${rides.length} completed rides...`);
  
  const bills = [];
  const paymentStatuses = ['pending', 'completed', 'failed'];
  const paymentStatusWeights = [0.1, 0.8, 0.1]; // Probability distribution
  const paymentMethods = ['credit_card', 'cash'];
  
  // Filter for completed rides only
  const completedRides = rides.filter(ride => ride.status === 'completed');
  console.log(`Found ${completedRides.length} completed rides`);
  
  for (let i = 0; i < completedRides.length; i++) {
    const ride = completedRides[i];
    
    const bill_id = generateSSN();
    
    // Calculate a random status based on weights
    let paymentStatus;
    const random = Math.random();
    let cumulativeWeight = 0;
    for (let j = 0; j < paymentStatuses.length; j++) {
      cumulativeWeight += paymentStatusWeights[j];
      if (random <= cumulativeWeight) {
        paymentStatus = paymentStatuses[j];
        break;
      }
    }
    
    // Create dropoff time by adding duration to pickup time
    const pickupTime = new Date(ride.date_time);
    const dropoffTime = new Date(pickupTime.getTime() + ride.duration * 60000);
    
    const baseFare = 3.0;
    const distanceFare = ride.distance * 1.5;
    const timeFare = ride.duration * 0.2;
    const surgeMultiplier = ride.fare_amount / (baseFare + distanceFare + timeFare);
    
    const bill = {
      bill_id,
      date: new Date().toISOString(),
      pickup_time: ride.date_time,
      dropoff_time: dropoffTime.toISOString(),
      distance_covered: ride.distance,
      total_amount: ride.fare_amount,
      source_location: `${ride.pickup_location.latitude},${ride.pickup_location.longitude}`,
      destination_location: `${ride.dropoff_location.latitude},${ride.dropoff_location.longitude}`,
      driver_id: ride.driver_id,
      customer_id: ride.customer_id,
      payment_status: paymentStatus,
      payment_method: getRandomElement(paymentMethods),
      ride_id: ride.ride_id,
      breakdown: {
        base_fare: baseFare,
        distance_fare: distanceFare,
        time_fare: timeFare,
        surge_multiplier: surgeMultiplier
      }
    };
    
    bills.push(bill);
    
    // Log progress
    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1} bills of ${completedRides.length}`);
    }
  }
  
  return bills;
};

// Bulk insert data
const bulkInsert = async (endpoint, data, batchSize = 20) => {
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

// Main function
const main = async () => {
  try {
    // Login to get admin token (will create admin if needed)
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Failed to login or create admin account. Exiting.');
      return;
    }
    
    // Target numbers
    const targetDrivers = 500;  // Scale up to 10,000 for final run
    const targetCustomers = 500; // Scale up to 10,000 for final run
    const targetRides = 1000;   // Scale up to 100,000 for final run
    
    // Generate in chunks
    const chunkSize = 200;
    let allDrivers = [];
    let allCustomers = [];
    
    // Generate and insert drivers in chunks
    for (let i = 0; i < targetDrivers; i += chunkSize) {
      const count = Math.min(chunkSize, targetDrivers - i);
      const drivers = await generateDrivers(count, i);
      allDrivers = allDrivers.concat(drivers);
      await bulkInsert('drivers', drivers);
    }
    
    // Generate and insert customers in chunks
    for (let i = 0; i < targetCustomers; i += chunkSize) {
      const count = Math.min(chunkSize, targetCustomers - i);
      const customers = await generateCustomers(count, i);
      allCustomers = allCustomers.concat(customers);
      await bulkInsert('customers', customers);
    }
    
    // Generate and insert rides in chunks
    const rideChunkSize = 500;
    let allRides = [];
    
    for (let i = 0; i < targetRides; i += rideChunkSize) {
      const count = Math.min(rideChunkSize, targetRides - i);
      const rides = await generateRides(count, allDrivers, allCustomers, i);
      allRides = allRides.concat(rides);
      await bulkInsert('rides', rides);
    }
    
    // Generate and insert bills
    const bills = await generateBills(allRides);
    await bulkInsert('billing', bills);
    
    console.log('Data generation and insertion complete!');
    console.log(`Generated and inserted ${allDrivers.length} drivers`);
    console.log(`Generated and inserted ${allCustomers.length} customers`);
    console.log(`Generated and inserted ${allRides.length} rides`);
    console.log(`Generated and inserted ${bills.length} bills`);
  } catch (error) {
    console.error('Error in data generation:', error);
  }
};

main();