// auth_test_v2.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = '';
let CUSTOMER_TOKEN = '';
let DRIVER_TOKEN = '';
let TEST_CUSTOMER_ID = '';
let TEST_DRIVER_ID = '';
let TEST_RIDE_ID = '';

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
    console.error('Admin login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Create test customer
const createTestCustomer = async () => {
  const customerId = generateSSN();
  TEST_CUSTOMER_ID = customerId;
  
  const customerData = {
    customer_id: customerId,
    first_name: 'TestCustomer',
    last_name: 'ForRides',
    email: `testcustomer_${Date.now()}@test.com`,
    password: 'password123',
    phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
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

  try {
    const response = await axios.post(`${API_URL}/customers`, customerData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log('Test customer created:', customerId);
    return customerData;
  } catch (error) {
    console.error('Error creating test customer:', error.response?.data?.message || error.message);
    return null;
  }
};

// Create test driver
const createTestDriver = async () => {
  const driverId = generateSSN();
  TEST_DRIVER_ID = driverId;
  
  const driverData = {
    driver_id: driverId,
    first_name: 'TestDriver',
    last_name: 'ForBilling',
    email: `testdriver_${Date.now()}@test.com`,
    password: 'password123',
    phone: `555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    address: '456 Test St',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    car_details: 'Toyota Camry 2020',
    status: 'available'  // Make sure driver is available
  };

  try {
    const response = await axios.post(`${API_URL}/drivers`, driverData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log('Test driver created:', driverId);
    return driverData;
  } catch (error) {
    console.error('Error creating test driver:', error.response?.data?.message || error.message);
    return null;
  }
};

// Login as customer
const loginAsCustomer = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/customer/login`, {
      email,
      password,
      role: 'customer'
    });
    
    CUSTOMER_TOKEN = response.data.token;
    console.log('Customer logged in successfully');
    return true;
  } catch (error) {
    console.error('Customer login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Login as driver
const loginAsDriver = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/driver/login`, {
      email,
      password,
      role: 'driver'
    });
    
    DRIVER_TOKEN = response.data.token;
    TEST_DRIVER_ID = response.data.data.driver_id;
    console.log('Driver logged in successfully with ID:', TEST_DRIVER_ID);
    return true;
  } catch (error) {
    console.error('Driver login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Create a test ride
const createTestRide = async () => {
  const rideData = {
    pickup_location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    dropoff_location: {
      latitude: 37.7849,
      longitude: -122.4294
    },
    date_time: new Date().toISOString(),
    passenger_count: 1,
    driver_id: TEST_DRIVER_ID  // Specify the driver ID
  };

  try {
    console.log('Creating test ride with customer token...');
    console.log('Ride data:', JSON.stringify(rideData, null, 2));
    
    const response = await axios.post(`${API_URL}/rides`, rideData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`
      }
    });
    
    console.log('Test ride created successfully:', response.data);
    TEST_RIDE_ID = response.data.data.ride_id;
    return response.data.data;
  } catch (error) {
    console.error('Error creating test ride:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

// Driver accepts the ride
const acceptRide = async () => {
  try {
    console.log(`Driver accepting ride ${TEST_RIDE_ID}...`);
    
    const response = await axios.patch(`${API_URL}/rides/${TEST_RIDE_ID}/accept`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DRIVER_TOKEN}`
      }
    });
    
    console.log('Ride accepted:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error accepting ride:', error.response?.data?.message || error.message);
    return null;
  }
};

// Driver starts the ride
const startRide = async () => {
  try {
    console.log(`Driver starting ride ${TEST_RIDE_ID}...`);
    
    const response = await axios.patch(`${API_URL}/rides/${TEST_RIDE_ID}/start`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DRIVER_TOKEN}`
      }
    });
    
    console.log('Ride started:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error starting ride:', error.response?.data?.message || error.message);
    return null;
  }
};

// Driver completes the ride
const completeRide = async () => {
  try {
    console.log(`Driver completing ride ${TEST_RIDE_ID}...`);
    
    const response = await axios.patch(`${API_URL}/rides/${TEST_RIDE_ID}/complete`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DRIVER_TOKEN}`
      }
    });
    
    console.log('Ride completed:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error completing ride:', error.response?.data?.message || error.message);
    return null;
  }
};

// Create a test bill
const createTestBill = async () => {
  const billData = {
    ride_id: TEST_RIDE_ID
  };

  try {
    console.log('Creating test bill with driver token...');
    console.log('Bill data:', JSON.stringify(billData, null, 2));
    
    const response = await axios.post(`${API_URL}/billing`, billData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DRIVER_TOKEN}`
      }
    });
    
    console.log('Test bill created successfully:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating test bill:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

// Main test function
const runCompleteTest = async () => {
  try {
    // Login as admin first
    await loginAsAdmin();
    
    // Create test customer and driver
    const customer = await createTestCustomer();
    const driver = await createTestDriver();
    
    if (!customer || !driver) {
      console.error('Failed to create test accounts. Aborting test.');
      return;
    }
    
    // Login as customer and driver
    await loginAsCustomer(customer.email, customer.password);
    await loginAsDriver(driver.email, driver.password);
    
    if (!CUSTOMER_TOKEN || !DRIVER_TOKEN) {
      console.error('Failed to login as customer or driver. Aborting test.');
      return;
    }
    
    // Create a test ride as customer
    const ride = await createTestRide();
    
    if (!ride) {
      console.error('Failed to create test ride. Aborting test.');
      return;
    }
    
    // Driver accepts the ride
    const acceptedRide = await acceptRide();
    if (!acceptedRide) {
      console.error('Failed to accept ride. Aborting test.');
      return;
    }
    
    // Driver starts the ride
    const startedRide = await startRide();
    if (!startedRide) {
      console.error('Failed to start ride. Aborting test.');
      return;
    }
    
    // Driver completes the ride
    const completedRide = await completeRide();
    if (!completedRide) {
      console.error('Failed to complete ride. Aborting test.');
      return;
    }
    
    // Create a test bill as driver
    const bill = await createTestBill();
    
    if (!bill) {
      console.error('Failed to create test bill.');
    } else {
      console.log('Successfully created bill!');
    }
    
    console.log('Complete test finished successfully.');
  } catch (error) {
    console.error('Error in complete test:', error);
  }
};

// Run the test
runCompleteTest();