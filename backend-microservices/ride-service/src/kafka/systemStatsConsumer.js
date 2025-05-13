const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { Ride } = require('../models/ride');
const { sendMessage } = require('./rideEventProducer');

const consumer = kafka.consumer({ groupId: 'ride-stats-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for system stats in Ride service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.SYSTEM_STATS_REQUEST, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const requestData = JSON.parse(message.value.toString());
          console.log('Received system stats request:', requestData);

          const { request_id } = requestData;
          if (!request_id) throw new CustomError('Missing request_id in stats request', 400);

          const totalRides = await Ride.countDocuments();
          const requestedRides = await Ride.countDocuments({ status: 'requested' });
          const acceptedRides = await Ride.countDocuments({ status: 'accepted' });
          const inProgressRides = await Ride.countDocuments({ status: 'in_progress' });
          const completedRides = await Ride.countDocuments({ status: 'completed' });
          const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });
          const totalDistance = await Ride.aggregate([{ $group: { _id: null, total: { $sum: '$distance' } } }]);
          const averageFare = await Ride.aggregate([{ $group: { _id: null, avg: { $avg: '$fare_amount' } } }]);

          const stats = {
            service: 'ride',
            request_id,
            timestamp: new Date().toISOString(),
            data: {
              total_rides: totalRides,
              requested_rides: requestedRides,
              accepted_rides: acceptedRides,
              in_progress_rides: inProgressRides,
              completed_rides: completedRides,
              cancelled_rides: cancelledRides,
              total_distance: totalDistance[0]?.total?.toFixed(2) || 0,
              average_fare: averageFare[0]?.avg?.toFixed(2) || 0
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
              topic: KAFKA_TOPICS.RIDE_DLQ,
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
            console.log('Error message sent to RIDE_DLQ');
          } catch (dlqError) {
            console.error('Error sending to RIDE_DLQ:', dlqError);
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