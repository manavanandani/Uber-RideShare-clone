const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { Billing } = require('../models/billing');
const { sendMessage } = require('./billingEventProducer');

const consumer = kafka.consumer({ groupId: 'billing-ride-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for ride events in Billing service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.RIDE_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('Received ride event:', eventData);

          const { 
            event_type, 
            ride_id, 
            customer_id, 
            driver_id, 
            status, 
            distance, 
            duration, 
            fare_amount, 
            pickup_location, 
            dropoff_location, 
            date_time,
            fare_breakdown 
          } = eventData;

          if (!event_type || !ride_id || !customer_id || !driver_id || !status || !distance || !duration || !fare_amount || !pickup_location || !dropoff_location || !date_time || !fare_breakdown) {
            throw new CustomError('Missing required event fields', 400);
          }

          if (event_type !== 'RIDE_COMPLETED') {
            console.log(`Ignoring event type: ${event_type}`);
            return;
          }

          if (status !== 'completed') {
            throw new CustomError('Cannot create bill for non-completed ride', 400);
          }

          const existingBill = await Billing.findOne({ ride_id });
          if (existingBill) {
            console.log(`Bill already exists for ride ${ride_id}`);
            return;
          }

          const bill_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;

          const bill = new Billing({
            bill_id,
            date: new Date(),
            pickup_time: new Date(date_time),
            dropoff_time: new Date(),
            distance_covered: distance,
            total_amount: fare_amount,
            source_location: `${pickup_location.latitude},${pickup_location.longitude}`,
            destination_location: `${dropoff_location.latitude},${dropoff_location.longitude}`,
            driver_id,
            customer_id,
            payment_status: 'pending',
            payment_method: 'credit_card',
            ride_id,
            breakdown: {
              base_fare: fare_breakdown.base_fare,
              distance_fare: fare_breakdown.distance_fare,
              time_fare: fare_breakdown.time_fare,
              surge_multiplier: fare_breakdown.surge_multiplier
            }
          });

          await bill.save();

          await sendMessage({
            topic: KAFKA_TOPICS.BILLING_EVENTS,
            message: {
              key: bill_id,
              value: {
                event_type: 'BILLING_CREATED',
                bill_id,
                date: bill.date,
                total_amount: bill.total_amount,
                driver_id,
                customer_id,
                ride_id
              }
            }
          });

          console.log(`Bill ${bill_id} created for ride ${ride_id}`);
        } catch (error) {
          console.error('Error processing ride event:', error);
          try {
            await kafka.producer().send({
              topic: KAFKA_TOPICS.BILLING_DLQ,
              messages: [
                {
                  key: message.key || null,
                  value: JSON.stringify({
                    originalTopic: topic,
                    originalMessage: message.value.toString(),
                    error: error.message,
                    timestamp: new Date().toISOString()
                  })
                }
              ]
            });
            console.log('Error message sent to BILLING_DLQ');
          } catch (dlqError) {
            console.error('Error sending to BILLING_DLQ:', dlqError);
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to run ride event consumer:', error);
    throw new CustomError('Kafka ride event consumer setup failed', 500);
  }
};

module.exports = { runConsumer };