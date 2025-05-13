const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { Billing } = require('../models/billing');
const { sendMessage } = require('./billingEventProducer');

const consumer = kafka.consumer({ groupId: 'billing-stats-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for system stats in Billing service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.SYSTEM_STATS_REQUEST, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const requestData = JSON.parse(message.value.toString());
          console.log('Received system stats request:', requestData);

          const { request_id } = requestData;

          if (!request_id) {
            throw new CustomError('Missing request_id in stats request', 400);
          }

          const totalBills = await Billing.countDocuments();
          const pendingBills = await Billing.countDocuments({ payment_status: 'pending' });
          const completedBills = await Billing.countDocuments({ payment_status: 'completed' });
          const failedBills = await Billing.countDocuments({ payment_status: 'failed' });
          const totalRevenue = await Billing.aggregate([
            { $group: { _id: null, total: { $sum: '$total_amount' } } }
          ]);
          const averageBillAmount = await Billing.aggregate([
            { $group: { _id: null, avg: { $avg: '$total_amount' } } }
          ]);

          const stats = {
            service: 'billing',
            request_id,
            timestamp: new Date().toISOString(),
            data: {
              total_bills: totalBills,
              pending_bills: pendingBills,
              completed_bills: completedBills,
              failed_bills: failedBills,
              total_revenue: totalRevenue[0]?.total?.toFixed(2) || 0,
              average_bill_amount: averageBillAmount[0]?.avg?.toFixed(2) || 0
            }
          };

          await sendMessage({
            topic: KAFKA_TOPICS.SYSTEM_STATS_RESPONSE,
            message: {
              key: request_id,
              value: stats
            }
          });
          console.log(`Sent stats for request ${request_id}:`, stats);
        } catch (error) {
          console.error('Error processing system stats request:', error);
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
    console.error('Failed to run system stats consumer:', error);
    throw new CustomError('Kafka system stats consumer setup failed', 500);
  }
};

module.exports = { runConsumer };