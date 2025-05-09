// src/pages/driver/AvailableRides.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function AvailableRides() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [availableRides, setAvailableRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(currentLocation);
          fetchAvailableRides(currentLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not get your current location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, [user]);


useEffect(() => {
  // Function to update location and available rides
  const updateLocationAndRides = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Only update if location has changed significantly (more than 0.5 km)
          if (location) {
            const { calculateDistance } = await import('../../utils/locationUtils');
            const distance = calculateDistance(location, currentLocation);
            if (distance < 0.5) {
              return; // Skip update if haven't moved much
            }
          }
          
          setLocation(currentLocation);
          
          // Silently update driver location in database
          await driverService.updateStatus(user.driver_id, 'available', currentLocation);
          
          // Update available rides
          await fetchAvailableRides(currentLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };
  
  // Update location every minute
  const locationInterval = setInterval(updateLocationAndRides, 60000);
  
  return () => clearInterval(locationInterval);
}, [location, user]);

  const fetchAvailableRides = async (loc) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await driverService.getAvailableRides(
        loc.latitude,
        loc.longitude
      );
      
      setAvailableRides(response.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available rides');
      setLoading(false);
    }
  };

const refreshLocationAndRides = async () => {
  setRefreshing(true);
  try {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Update driver location in database
          await driverService.updateStatus(user.driver_id, 'available', newLocation);
          
          // Fetch available rides with new location
          await fetchAvailableRides(newLocation);
          setRefreshing(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not update your location. Please enable location services.");
          setRefreshing(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setRefreshing(false);
    }
  } catch (err) {
    console.error('Error refreshing location:', err);
    setError('Failed to refresh your location and available rides');
    setRefreshing(false);
  }
};

  const handleSelectRide = (ride) => {
    console.log('Selected ride:', ride);
    setSelectedRide(ride);
    
    if (!ride.pickup_location || !ride.dropoff_location) {
      console.error('Missing location data in ride:', ride);
      setError('This ride has incomplete location data.');
      return;
    }

    const formattedRide = {
      ...ride,
      pickup_location: {
        latitude: ride.pickup_location.coordinates[1],
        longitude: ride.pickup_location.coordinates[0]
      },
      dropoff_location: {
        latitude: ride.dropoff_location.coordinates[1], 
        longitude: ride.dropoff_location.coordinates[0]
      }
    };
    
    setSelectedRide(formattedRide);
  };

const handleAcceptRide = async () => {
  if (!selectedRide) return;
  
  // Check if ride is too far before trying to accept
  if (selectedRide.distance_to_pickup > 16) {
    setError("This ride is too far away to accept (more than 10 miles from your current location)");
    return;
  }
  
  try {
    setAccepting(true);
    console.log('Accepting ride:', selectedRide.ride_id);
    await driverService.acceptRide(selectedRide.ride_id);

    await driverService.getProfile(user.driver_id);

    setAccepting(false);

    // Show success message
    alert('Ride accepted successfully! Navigating to active ride...');
    
    setTimeout(() => {
      navigate('/driver/rides/active');
    }, 500);
  } catch (err) {
    console.error('Error accepting ride:', err);
    let errorMessage = err.response?.data?.message || 'Failed to accept ride';
    
    // Check for distance error message
    if (err.response?.data?.distance) {
      errorMessage = `You are ${err.response.data.distance} km away from the pickup location (maximum allowed is 16 km)`;
    }
    
    setError(errorMessage);
    setAccepting(false);
  }
};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Available Rides</Typography>
        <Button 
          startIcon={<RefreshIcon />}
          onClick={refreshLocationAndRides}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ride Requests Near You
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {availableRides.length === 0 ? (
                <Typography>No ride requests available at the moment. Try refreshing later.</Typography>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {availableRides.map((ride) => (
                    <ListItem 
                      key={ride.ride_id} 
                      divider
                      button
                      selected={selectedRide?.ride_id === ride.ride_id}
                      onClick={() => handleSelectRide(ride)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: selectedRide?.ride_id === ride.ride_id ? 'action.selected' : 'background.paper'
                      }}
                    >
                      <ListItemText
                        primary={`Ride #${ride.ride_id}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {new Date(ride.date_time).toLocaleString()}
                            </Typography>
                            <br />
                            {ride.distance_to_pickup > 16 && (
        <Typography component="span" variant="body2" color="error.main">
          Too far to accept!
        </Typography>
      )}                            <br />
                            {`Passengers: ${ride.passenger_count || 1}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="h6" color="primary">
                          ${ride.fare_amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              {selectedRide ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Ride Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Pickup Location</Typography>
                        <Typography variant="body2">
                          {`${selectedRide.pickup_location.latitude.toFixed(4)}, ${selectedRide.pickup_location.longitude.toFixed(4)}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Drop-off Location</Typography>
                        <Typography variant="body2">
                          {`${selectedRide.dropoff_location.latitude.toFixed(4)}, ${selectedRide.dropoff_location.longitude.toFixed(4)}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Estimated Fare</Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                          ${selectedRide.fare_amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Estimated Time</Typography>
                        <Typography variant="body2">
                          {selectedRide.duration ? `${Math.round(selectedRide.duration)} mins` : 'N/A'}
                        </Typography>
                      </Grid>
                      {selectedRide.customer_info && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Customer</Typography>
                          <Typography variant="body2">
                            {`${selectedRide.customer_info.first_name || ''} ${selectedRide.customer_info.last_name || ''}`}
                            {selectedRide.customer_info.rating && ` (Rating: ${selectedRide.customer_info.rating.toFixed(1)})`}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                  
                  <Box sx={{ height: 250, mb: 2 }}>
                    <MapWithMarkers
                      pickup={{
                        lat: selectedRide.pickup_location.latitude,
                        lng: selectedRide.pickup_location.longitude
                      }}
                      dropoff={{
                        lat: selectedRide.dropoff_location.latitude,
                        lng: selectedRide.dropoff_location.longitude
                      }}
                      showDirections={true}
                      height={250}
                      markers={location ? [
                        {
                          position: {
                            lat: location.latitude,
                            lng: location.longitude
                          },
                          title: 'Your Location'
                        }
                      ] : []}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleAcceptRide}
                      disabled={accepting}
                      startIcon={<CarIcon />}
                    >
                      {accepting ? <CircularProgress size={24} /> : 'Accept Ride'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: 300
                }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Select a ride to view details
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Click on a ride from the list to see more information
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default AvailableRides;