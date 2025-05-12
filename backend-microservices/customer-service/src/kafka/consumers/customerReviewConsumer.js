const { kafka } = require('../../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { Customer } = require('../../models/customer');
const { CustomError } = require('../../../shared/utils/errors');

const consumer = kafka.consumer({ groupId: 'customer-review-consumer' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Customer review consumer connected');
    await consumer.subscribe({ topic: KAFKA_TOPICS.CUSTOMER_REVIEW_REQUEST });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const { customer_id, status, notes, reviewed_by, review_date } = JSON.parse(message.value);
          if (!customer_id || !status || !['approved', 'suspended', 'active'].includes(status)) {
            throw new CustomError('Invalid review message', 400);
          }
          const customer = await Customer.findOneAndUpdate(
            { customer_id },
            {
              $set: {
                status,
                admin_review: { reviewed_by, status, notes, review_date }
              }
            },
            { new: true }
          );
          if (!customer) {
            throw new CustomError('Customer not found', 404);
          }
          console.log(`Updated customer ${customer_id} status to ${status}`);
        } catch (error) {
          console.error('Error processing customer review:', error);
        }
      },
    });
  } catch (error) {
    console.error('Failed to run customer review consumer:', error);
  }
};

const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log('Customer review consumer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka consumer:', error);
  }
};

module.exports = { runConsumer, disconnectConsumer };