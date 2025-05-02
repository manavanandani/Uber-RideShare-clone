// test-data-generator.js
const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';

// Helper functions
const generateSSN = () => {
  const part1 = Math.floor(Math.random() * 900 + 100).toString();
  const part2 = Math.floor(Math.random() * 90 + 10).toString();
  const part3 = Math.floor(Math.random() * 9000 + 1000).toString();
  return `${part1}-${part2}-${part3}`;
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
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    process.exit(1);
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
      state: getRandomElement(states),
      zip_code: String(Math.floor(Math.random() * 90000) + 10000),
      car_details: `${getRandomElement(carMakers)} ${getRandomElement(carModels)} ${2015 + Math.floor(Math.random() * 10)}`,
      rating: (3 + Math.random() * 2).toFixed(1),
      intro_media: {
        location: {
          type: 'Point',
          coordinates: [
            getRandomLocation().longitude,
            getRandomLocation().latitude
          ]
        }
      },
      status: getRandomElement(['available', 'busy', 'offline'])
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
      state: getRandomElement(states),
      zip_code: String(Math.floor(Math.random() * 90000) + 10000),
      credit_card: {
        number: '4111111111111111',
        expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 5) + 25)}`,
        cvv: String(Math.floor(Math.random() * 900) + 100),
        name_on_card: `${first_name} ${last_name}`
      },
      rating: (3 + Math.random() * 2).toFixed(1),
      last_location: {
        type: 'Point',
        coordinates: [
          getRandomLocation().longitude,
          getRandomLocation().latitude
        ]
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

// Generate rides
const generateRides = async (count, drivers, customers) => {
  console.log(`Generating ${count} rides...`);
  
  const rides = [];
  const statuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
  const statusWeights = [0.05, 0.1, 0.05, 0.7, 0.1]; // Probability distribution
  
  for (let i = 0; i < count; i++) {
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
      console.log(`Generated ${i + 1} rides`);
    }
  }
  
  return rides;
};

// Generate bills
const generateBills = async (rides) => {
  console.log(`Generating bills for ${rides.length} rides...`);
  
  const bills = [];
  const paymentStatuses = ['pending', 'completed', 'failed'];
  const paymentStatusWeights = [0.1, 0.8, 0.1]; // Probability distribution
  const paymentMethods = ['credit_card', 'cash'];
  
  for (let i = 0; i < rides.length; i++) {
    const ride = rides[i];
    
    // Only generate bills for completed rides
    if (ride.status === 'completed') {
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
    }
    
    // Log progress
    if ((i + 1) % 1000 === 0) {
      console.log(`Processed ${i + 1} rides for billing`);
    }
  }
  
  return bills;
};

// Save data to files
const saveToFile = (data, filename) => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Saved data to ${filename}`);
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
      await axios.post(`${API_URL}/${endpoint}`, {
        bulk: true,
        items: batch
      }, { headers });
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
    } catch (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.response?.data?.message || error.message);
    }
    
    // Add a small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Main function
const main = async () => {
  try {
    // Login to get admin token
    await login();
    
    // Generate data
    const drivers = await generateDrivers(10000);
    const customers = await generateCustomers(10000);
    const rides = await generateRides(100000, drivers, customers);
    const bills = await generateBills(rides);
    
    // Save data to files
    saveToFile(drivers, 'test_drivers.json');
    saveToFile(customers, 'test_customers.json');
    saveToFile(rides, 'test_rides.json');
    saveToFile(bills, 'test_bills.json');
    
    // Bulk insert data
    await bulkInsert('drivers', drivers);
    await bulkInsert('customers', customers);
    await bulkInsert('rides', rides);
    await bulkInsert('billing', bills);
    
    console.log('Data generation and insertion complete!');
  } catch (error) {
    console.error('Error in data generation:', error);
  }
};

main();