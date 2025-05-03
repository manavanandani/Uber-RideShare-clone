// backend/tests/pricingModelTest.js
const axios = require('axios');
const { getDynamicPrice } = require('../services/pricingService');

// Test multiple scenarios
const testScenarios = [
  {
    name: 'Regular trip - non-peak',
    pickup: { latitude: 37.7749, longitude: -122.4194 }, // SF downtown
    dropoff: { latitude: 37.7749, longitude: -122.4694 }, // 5km west
    dateTime: new Date('2025-03-15T14:30:00'), // Saturday afternoon
    passengerCount: 1
  },
  {
    name: 'Morning rush hour',
    pickup: { latitude: 37.7749, longitude: -122.4194 },
    dropoff: { latitude: 37.7749, longitude: -122.4694 },
    dateTime: new Date('2025-03-17T08:30:00'), // Monday morning
    passengerCount: 1
  },
  {
    name: 'Weekend night',
    pickup: { latitude: 37.7749, longitude: -122.4194 },
    dropoff: { latitude: 37.7749, longitude: -122.4694 },
    dateTime: new Date('2025-03-15T01:30:00'), // Saturday night/early morning
    passengerCount: 1
  },
  {
    name: 'Multiple passengers',
    pickup: { latitude: 37.7749, longitude: -122.4194 },
    dropoff: { latitude: 37.7749, longitude: -122.4694 },
    dateTime: new Date('2025-03-15T14:30:00'),
    passengerCount: 3
  }
];

// Run tests
async function runTests() {
  console.log('Testing ML-based pricing model...\n');
  
  for (const scenario of testScenarios) {
    try {
      console.log(`Scenario: ${scenario.name}`);
      const price = await getDynamicPrice(
        scenario.pickup,
        scenario.dropoff,
        scenario.dateTime,
        scenario.passengerCount
      );
      
      console.log(`Fare: $${price.fare.toFixed(2)}`);
      console.log(`Distance: ${price.distance.toFixed(2)} km`);
      console.log(`Duration: ${price.duration.toFixed(0)} minutes`);
      console.log(`Surge Factor: ${price.surge_factor.toFixed(2)}x`);
      console.log(`Used ML Model: ${price.usedMlModel}`);
      console.log('Breakdown:');
      console.log(`  Base Fare: $${price.breakdown.base_fare.toFixed(2)}`);
      console.log(`  Distance Fare: $${price.breakdown.distance_fare.toFixed(2)}`);
      console.log(`  Time Fare: $${price.breakdown.time_fare.toFixed(2)}`);
      console.log(`  Surge Multiplier: ${price.breakdown.surge_multiplier.toFixed(2)}x`);
      console.log('------------------------------\n');
    } catch (error) {
      console.error(`Error testing scenario "${scenario.name}":`, error.message);
    }
  }
}

runTests();