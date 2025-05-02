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

  const handleRefresh = async () => {
    if (!location) {
      setError("Cannot refresh without location access.");
      return;
    }
    
    setRefreshing(true);
    await fetchAvailableRides(location);
    setRefreshing(false);
  };

  const handleSelectRide = (ride) => {
    setSelectedRide(ride);
  };

  const handleAcceptRide = async () => {
    if (!selectedRide) return;
    
    try {
      setAccepting(true);
      await driverService.acceptRide(selectedRide.ride_id);
      setAccepting(false);
      navigate('/driver/rides/active');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept ride');
      setAccepting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Available Rides</Typography>
        <Button 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
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
              
              // src/pages/driver/AvailableRides.jsx (continued)
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
                            {`Distance: ${ride.distance?.toFixed(2) || '0.0'} km`}
                            <br />
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