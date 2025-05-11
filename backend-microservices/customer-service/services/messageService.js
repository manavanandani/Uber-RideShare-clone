const { consumer, producer } = require('../config/kafka');
const Customer = require('../models/Customer');

const handleCustomerMessages = async () => {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'system_stats_request', fromBeginning: false });

  consumer.run({
    eachMessage: async ({ message }) => {
      const parsed = JSON.parse(message.value.toString());
      const { type, correlationId, replyTo } = parsed;

      if (type === 'GET_CUSTOMER_STATS') {
        try {
          const customerCount = await Customer.countDocuments();
          await producer.send({
            topic: replyTo,
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  correlationId,
                  source: 'customer-service',
                  data: { customerCount },
                }),
              },
            ],
          });
        } catch (err) {
          console.error('Error in customer stats:', err);
        }
      }
    },
  });
};

module.exports = { handleCustomerMessages };
