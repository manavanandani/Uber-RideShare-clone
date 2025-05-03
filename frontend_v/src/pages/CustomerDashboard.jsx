import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import axios from "axios";

const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("book");

  // Booking form state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Account update form state
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");

  // Ride history state
  const [rideHistory, setRideHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Rating state
  const [ratingRideId, setRatingRideId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (user) {
      const fullAddress = `${user.address || ""}, ${user.city || ""}, ${user.state || ""} ${user.zip_code || ""}`;
      setPickup(fullAddress);
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setStateName(user.state || "");
      setZip(user.zip_code || "");
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history" && user) {
      fetchRideHistory();
    }
  }, [activeTab, user]);

  const fetchRideHistory = async () => {
    if (!user || !user.customer_id) return;
    
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/rides/customer/${user.customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setRideHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching ride history:", error);
      alert("Failed to load ride history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBook = async () => {
    if (!pickup || !dropoff) {
      alert("Please enter both pickup and dropoff locations");
      return;
    }

    try {
      setBookingLoading(true);
      const token = localStorage.getItem("token");
      
      // In a real app, you would use a geocoding service to convert addresses to coordinates
      // For now, we'll use hardcoded coordinates for San Francisco
      const pickupLocation = {
        latitude: 37.7749,
        longitude: -122.4194
      };
      
      const dropoffLocation = {
        latitude: 37.7833,
        longitude: -122.4167
      };
      
      const response = await axios.post(
        '/api/rides',
        {
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          date_time: new Date().toISOString(),
          passenger_count: parseInt(passengerCount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Ride booked successfully!");
      console.log("Booked ride:", response.data);
      
      // Clear the dropoff field for next booking
      setDropoff("");
      
      // Switch to the history tab to show the new booking
      setActiveTab("history");
      
      // Refresh ride history
      fetchRideHistory();
      
    } catch (error) {
      console.error("Booking error:", error.response?.data || error.message);
      
      if (error.response?.data?.message === "No drivers available nearby") {
        alert("Sorry, there are no drivers available in your area right now. Please try again later.");
      } else {
        alert("Failed to book ride: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!user || !user.customer_id) {
      alert("User not found. Please log in again.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/customers/${user.customer_id}`,
        {
          phone,
          address,
          city,
          state: stateName,
          zip_code: zip,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert("Profile updated successfully");
      console.log("Updated customer:", response.data);
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      alert("Failed to update profile");
    }
  };

  const handleRateRide = (rideId) => {
    setRatingRideId(rideId);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/rides/${ratingRideId}/rate`,
        {
          rating: ratingValue,
          comment: ratingComment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      alert("Thank you for your rating!");
      setShowRatingModal(false);
      fetchRideHistory(); // Refresh the ride history
    } catch (error) {
      console.error("Rating error:", error);
      alert("Failed to submit rating");
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm("Are you sure you want to cancel this ride?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `/api/rides/${rideId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      alert("Ride cancelled successfully");
      fetchRideHistory(); // Refresh the ride history
    } catch (error) {
      console.error("Cancellation error:", error);
      alert("Failed to cancel ride");
    }
  };

  const formatRideStatus = (status) => {
    switch (status) {
      case 'requested': return 'Requested';
      case 'accepted': return 'Driver Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Welcome, {user?.first_name} 👋</h2>

      {/* TAB NAVIGATION */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === "book" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("book")}
        >
          Book Ride
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "account" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("account")}
        >
          Account Settings
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "history" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("history")}
        >
          Ride History
        </button>
      </div>

      {/* BOOK RIDE TAB */}
      {activeTab === "book" && (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
          <h3 className="text-xl font-semibold mb-4">Book a Ride</h3>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Pickup Location:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter pickup location"
              disabled={bookingLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Dropoff Location:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Enter dropoff location"
              disabled={bookingLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Passenger Count:</label>
            <select
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={passengerCount}
              onChange={(e) => setPassengerCount(e.target.value)}
              disabled={bookingLoading}
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'passenger' : 'passengers'}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              * For testing, this will use San Francisco coordinates
            </p>
            <button
              className={`bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition ${
                bookingLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleBook}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Booking...' : 'Book Ride'}
            </button>
          </div>
        </div>
      )}

      {/* ACCOUNT SETTINGS TAB */}
      {activeTab === "account" && (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
          <h3 className="text-xl font-semibold mb-4">Update Account</h3>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Phone:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Address:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">City:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">State:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Zip Code:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
          </div>

          <button
            className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition w-full"
            onClick={handleUpdateAccount}
          >
            Update Info
          </button>
        </div>
      )}

      {/* RIDE HISTORY TAB */}
      {activeTab === "history" && (
        <div className="bg-white p-6 rounded shadow-md">
          <h3 className="text-xl font-semibold mb-4">Your Rides</h3>
          
          {historyLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading your ride history...</p>
            </div>
          ) : rideHistory.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded">
              <p className="text-gray-500">You haven't taken any rides yet.</p>
              <button 
                onClick={() => setActiveTab("book")}
                className="mt-4 text-black underline hover:text-gray-700"
              >
                Book your first ride
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rideHistory.map((ride) => (
                <div key={ride.ride_id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          ride.status === 'completed' ? 'bg-green-500' : 
                          ride.status === 'in_progress' ? 'bg-blue-500' :
                          ride.status === 'accepted' ? 'bg-yellow-500' :
                          ride.status === 'requested' ? 'bg-gray-500' :
                          ride.status === 'cancelled' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></span>
                        <span className="font-semibold">{formatRideStatus(ride.status)}</span>
                      </div>
                      <div className="text-gray-500">
                        {ride.pickup_location.latitude.toFixed(4)}, {ride.pickup_location.longitude.toFixed(4)} to {ride.dropoff_location.latitude.toFixed(4)}, {ride.dropoff_location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-gray-500">
                        {new Date(ride.date_time).toLocaleString()}
                      </div>
                      <button
                        className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={() => handleCancelRide(ride.ride_id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
