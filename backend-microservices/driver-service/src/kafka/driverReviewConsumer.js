const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { Driver } = require('../models/driver');

const consumer = kafka.consumer({ groupId: 'driver-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for Driver service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.DRIVER_REVIEW_REQUEST, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const reviewData = JSON.parse(message.value.toString());
          console.log('Received review request:', reviewData);

          const { driver_id, ride_id, rating, comment, customer_id } = reviewData;

          if (!driver_id || !ride_id || !rating || !customer_id) {
            throw new CustomError('Missing required review fields', 400);
          }

          const driver = await Driver.findOne({ driver_id });
          if (!driver) {
            throw new CustomError('Driver not found', 404);
          }

          const newReview = {
            ride_id,
            customer_id,
            rating: parseFloat(rating),
            comment: comment || '',
            date: new Date()
          };

          driver.reviews.push(newReview);

          const totalReviews = driver.reviews.length;
          const averageRating = driver.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
          driver.rating = parseFloat(averageRating.toFixed(2));

          await driver.save();
          console.log(`Review added for driver ${driver_id}, new rating: ${driver.rating}`);
        } catch (error) {
          console.error('Error processing review:', error);
          try {
            await kafka.producer().send({
              topic: KAFKA_TOPICS.DRIVER_DLQ,
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
            console.log('Error message sent to DLQ');
          } catch (dlqError) {
            console.error('Error sending to DLQ:', dlqError);
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to run Kafka consumer:', error);
    throw new CustomError('Kafka consumer setup failed', 500);
  }
};

module.exports = { runConsumer };