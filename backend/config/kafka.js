// Enhanced kafka.js with consumer logic implementation

const { Kafka } = require('kafkajs');
const dotenv = require('dotenv');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const Billing = require('../models/Billing');
const { redisClient, invalidateCache } = require('./redis');

dotenv.config();

const kafka = new Kafka({
  clientId: 'uber-simulation',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'uber-simulation-group' });

// Handler for ride_requests topic
const handleRideRequest = async (message) => {
  try {
    const { ride_id, driver_id, customer_id } = message.data;
    console.log(`Processing ride request: ${ride_id} for driver ${driver_id}`);
    
    // Update driver status to busy
    await Driver.findOneAndUpdate(
      { driver_id },
      { $set: { status: 'busy' } }
    );
    
    // Invalidate related caches
    await invalidateCache(`*driver*${driver_id}*`);
    await invalidateCache(`*customer*${customer_id}*`);
    
    console.log(`Ride request ${ride_id} processed successfully`);
  } catch (error) {
    console.error(`Error handling ride request: ${error.message}`);
  }
};

// Handler for ride_responses topic
const handleRideResponse = async (message) => {
  try {
    const { type, data } = message;
    const { rideId, driverId } = data;
    
    switch (type) {
      case 'RIDE_ACCEPTED':
        console.log(`Driver ${driverId} accepted ride ${rideId}`);
        // Update ride status
        await Ride.findOneAndUpdate(
          { ride_id: rideId },
          { $set: { status: 'accepted' } }
        );
        break;
        
      case 'RIDE_REJECTED':
        console.log(`Driver ${driverId} rejected ride ${rideId}: ${data.reason}`);
        // Handle ride rejection
        await Ride.findOneAndUpdate(
          { ride_id: rideId },
          { $set: { status: 'cancelled', cancellation_reason: data.reason } }
        );
        
        // Make driver available again
        await Driver.findOneAndUpdate(
          { driver_id: driverId },
          { $set: { status: 'available' } }
        );
        break;
        
      case 'RIDE_COMPLETED':
        console.log(`Ride ${rideId} completed`);
        const ride = await Ride.findOne({ ride_id: rideId });
        
        if (ride) {
          // Update ride status
          await Ride.findOneAndUpdate(
            { ride_id: rideId },
            { $set: { status: 'completed' } }
          );
          
          // Make driver available again
          await Driver.findOneAndUpdate(
            { driver_id: ride.driver_id },
            { $set: { status: 'available' } }
          );
          
          // Generate bill for this ride
          const bill_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
          
          const newBill = new Billing({
            bill_id,
            date: new Date(),
            pickup_time: ride.date_time,
            dropoff_time: new Date(),
            distance_covered: ride.distance,
            total_amount: ride.fare_amount,
            source_location: `${ride.pickup_location.latitude},${ride.pickup_location.longitude}`,
            destination_location: `${ride.dropoff_location.latitude},${ride.dropoff_location.longitude}`,
            driver_id: ride.driver_id,
            customer_id: ride.customer_id,
            payment_status: 'pending',
            payment_method: 'credit_card',
            ride_id: ride.ride_id,
            breakdown: {
              base_fare: 3.0,
              distance_fare: ride.distance * 1.5,
              time_fare: ride.duration * 0.2,
              surge_multiplier: 1.0
            }
          });
          
          await newBill.save();
          console.log(`Bill ${bill_id} generated for ride ${rideId}`);
        }
        break;
        
      default:
        console.log(`Unknown ride response type: ${type}`);
    }
    
    // Invalidate related caches
    await invalidateCache('*rides*');
    if (driverId) await invalidateCache(`*driver*${driverId}*`);
    
  } catch (error) {
    console.error(`Error handling ride response: ${error.message}`);
  }
};

// Handler for billing_events topic
const handleBillingEvent = async (message) => {
  try {
    const { type, data } = message;
    
    switch (type) {
      case 'BILLING_CREATED':
        console.log(`Billing created: ${data.bill_id} for ride ${data.ride_id}`);
        // Notify customer about new bill
        // This could trigger an email notification in a real system
        break;
        
      case 'PAYMENT_PROCESSED':
        console.log(`Payment processed for bill ${data.billingId}: ${data.status}`);
        // Update ride with payment information
        const bill = await Billing.findOne({ bill_id: data.billingId });
        if (bill) {
          await Ride.findOneAndUpdate(
            { ride_id: bill.ride_id },
            { $set: { payment_status: data.status } }
          );
          
          // Update driver earnings if payment was successful
          if (data.status === 'completed') {
            await Driver.findOneAndUpdate(
              { driver_id: bill.driver_id },
              { $inc: { earnings: bill.total_amount * 0.8 } } // Driver gets 80% of fare
            );
          }
        }
        break;
        
      default:
        console.log(`Unknown billing event type: ${type}`);
    }
    
    // Invalidate relevant caches
    await invalidateCache('*billing*');
    
  } catch (error) {
    console.error(`Error handling billing event: ${error.message}`);
  }
};

// Handler for driver_events topic
const handleDriverEvent = async (message) => {
  try {
    const { type, data } = message;
    const { driverId, status, location } = data;
    
    switch (type) {
      case 'DRIVER_STATUS_CHANGED':
        console.log(`Driver ${driverId} status changed to ${status}`);
        // Update nearby customers about driver availability
        if (status === 'available' && location) {
          // Find customers within 10km
          const nearbyCustomers = await Customer.find({
            'last_location': {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [location.longitude, location.latitude]
                },
                $maxDistance: 10000
              }
            }
          }).select('customer_id');
          
          // In a real system, you might send push notifications to these customers
          console.log(`Notifying ${nearbyCustomers.length} nearby customers about available driver`);
        }
        break;
        
      default:
        console.log(`Unknown driver event type: ${type}`);
    }
    
    // Invalidate driver caches
    await invalidateCache(`*driver*${driverId}*`);
    
  } catch (error) {
    console.error(`Error handling driver event: ${error.message}`);
  }
};

// Handler for customer_events topic
const handleCustomerEvent = async (message) => {
  try {
    const { type, data } = message;
    const { customerId } = data;
    
    switch (type) {
      case 'CUSTOMER_CREATED':
        console.log(`New customer created: ${customerId} - ${data.name}`);
        // Send welcome email/notification logic would go here
        break;
        
      case 'CUSTOMER_UPDATED':
        console.log(`Customer updated: ${customerId} - ${data.name}`);
        break;
        
      case 'CUSTOMER_LOCATION_UPDATED':
        console.log(`Customer ${customerId} location updated`);
        // Find nearby drivers if customer is looking for a ride
        if (data.lookingForRide) {
          const location = data.location;
          // Find available drivers within 10km
          const nearbyDrivers = await Driver.find({
            'intro_media.location': {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [location.longitude, location.latitude]
                },
                $maxDistance: 10000
              }
            },
            status: 'available'
          }).select('driver_id first_name last_name car_details rating');
          
          console.log(`Found ${nearbyDrivers.length} drivers near customer ${customerId}`);
          // Cache these results for quick access
          await redisClient.set(
            `nearby_drivers:${customerId}`,
            JSON.stringify(nearbyDrivers),
            'EX',
            60 // Cache for 1 minute
          );
        }
        break;
        
      default:
        console.log(`Unknown customer event type: ${type}`);
    }
    
    // Invalidate customer caches
    await invalidateCache(`*customer*${customerId}*`);
    
  } catch (error) {
    console.error(`Error handling customer event: ${error.message}`);
  }
};

const initKafka = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
    
    await consumer.connect();
    console.log('Kafka consumer connected');
    
    await consumer.subscribe({ topics: [
      'ride_requests',
      'ride_responses',
      'billing_events',
      'driver_events',
      'customer_events'
    ] });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = JSON.parse(message.value.toString());
          console.log(`Received message from topic ${topic}:`, messageValue);
          
          switch (topic) {
            case 'ride_requests':
              await handleRideRequest(messageValue);
              break;
            case 'ride_responses':
              await handleRideResponse(messageValue);
              break;
            case 'billing_events':
              await handleBillingEvent(messageValue);
              break;
            case 'driver_events':
              await handleDriverEvent(messageValue);
              break;
            case 'customer_events':
              await handleCustomerEvent(messageValue);
              break;
            default:
              console.log(`No handler for topic ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing Kafka message from topic ${topic}:`, error);
        }
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) }
      ],
    });
    return true;
  } catch (error) {
    console.error(`Error sending message to topic ${topic}:`, error);
    return false;
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  initKafka,
  sendMessage
};