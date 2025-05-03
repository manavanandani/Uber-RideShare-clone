import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RideHistory = ({ token, customerId }) => {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        const res = await axios.get(`/api/rides/customer/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRides(res.data.data);
      } catch (err) {
        console.error('Error fetching ride history:', err);
        setError('Could not load ride history');
      }
    };

    fetchRideHistory();
  }, [customerId, token]);

  return (
    <div>
      <h2>Ride History</h2>
      {error && <p>{error}</p>}
      {rides.length === 0 ? (
        <p>No rides found</p>
      ) : (
        <ul>
          {rides.map((ride) => (
            <li key={ride.ride_id}>
              <strong>Ride ID:</strong> {ride.ride_id}<br />
              <strong>Status:</strong> {ride.status}<br />
              <strong>Date:</strong> {new Date(ride.date_time).toLocaleString()}<br />
              <strong>Pickup:</strong> {ride.pickup_location.latitude}, {ride.pickup_location.longitude}<br />
              <strong>Dropoff:</strong> {ride.dropoff_location.latitude}, {ride.dropoff_location.longitude}<br />
              <strong>Fare:</strong> ${ride.fare_amount}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RideHistory;
