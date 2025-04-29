// src/pages/driver/AvailableRides.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../../services/api';

function AvailableRides() {
  const { user } = useSelector(state => state.auth);
  const [rides, setRides] = useState({
    available: [],
    accepted: [],
    inProgress: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        
        // Get driver status first
        const profileResponse = await api.get(`/drivers/${user.driver_id}`);
        
        // If driver is not available, update status
        if (profileResponse.data.data.status !== 'available') {
          // Update to available and get current location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              await api.patch(`/drivers/${user.driver_id}/status`, {
                status: 'available',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            }, (_err) => {
              setError('Location access is required to see available rides. Please enable location access.');
              setLoading(false);
            });          }
        }
        
        // Get all rides for the driver
        const ridesResponse = await api.get(`/rides/driver/${user.driver_id}`);
        
        // Categorize rides by status
        const allRides = ridesResponse.data.data;
        const available = allRides.filter(ride => ride.status === 'requested');
        const accepted = allRides.filter(ride => ride.status === 'accepted');
        const inProgress = allRides.filter(ride => ride.status === 'in_progress');
        
        setRides({
          available,
          accepted,
          inProgress
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load rides');
        setLoading(false);
      }
    };
    
    fetchRides();
    
    // Set up polling to refresh rides
    const interval = setInterval(() => {
      fetchRides();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const handleAcceptRide = async (rideId) => {
    try {
      await api.patch(`/rides/${rideId}/accept`);
      
      // Update local state
      const updatedRide = rides.available.find(ride => ride.ride_id === rideId);
      if (updatedRide) {
        updatedRide.status = 'accepted';
        setRides({
          available: rides.available.filter(ride => ride.ride_id !== rideId),
          accepted: [...rides.accepted, updatedRide],
          inProgress: rides.inProgress
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleStartRide = async (rideId) => {
    try {
      await api.patch(`/rides/${rideId}/start`);
      
      // Update local state
      const updatedRide = rides.accepted.find(ride => ride.ride_id === rideId);
      if (updatedRide) {
        updatedRide.status = 'in_progress';
        setRides({
          available: rides.available,
          accepted: rides.accepted.filter(ride => ride.ride_id !== rideId),
          inProgress: [...rides.inProgress, updatedRide]
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId) => {
    try {
      await api.patch(`/rides/${rideId}/complete`);
      
      // Update local state
      setRides({
        available: rides.available,
        accepted: rides.accepted,
        inProgress: rides.inProgress.filter(ride => ride.ride_id !== rideId)
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete ride');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ride Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* In Progress Rides */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          In Progress Rides
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {rides.inProgress.length === 0 ? (
          <Typography>No rides in progress.</Typography>
        ) : (
          <Grid container spacing={3}>
            {rides.inProgress.map(ride => (
              <Grid item xs={12} key={ride.ride_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        Ride #{ride.ride_id}
                      </Typography>
                      <Chip 
                        label="In Progress" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Pickup:</strong> {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Dropoff:</strong> {`${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Time:</strong> {new Date(ride.date_time).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Passengers:</strong> {ride.passenger_count}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                          ${ride.fare_amount.toFixed(2)}
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="success"
                          onClick={() => handleCompleteRide(ride.ride_id)}
                        >
                          Complete Ride
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Accepted Rides */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Accepted Rides
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {rides.accepted.length === 0 ? (
          <Typography>No accepted rides.</Typography>
        ) : (
          <Grid container spacing={3}>
            {rides.accepted.map(ride => (
              <Grid item xs={12} key={ride.ride_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        Ride #{ride.ride_id}
                      </Typography>
                      <Chip 
                        label="Accepted" 
                        color="success" 
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Pickup:</strong> {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Dropoff:</strong> {`${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Time:</strong> {new Date(ride.date_time).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Passengers:</strong> {ride.passenger_count}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                          ${ride.fare_amount.toFixed(2)}
                        </Typography>
                        <Button 
                          variant="contained" 
                          onClick={() => handleStartRide(ride.ride_id)}
                        >
                          Start Ride
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Available Rides */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Rides
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {rides.available.length === 0 ? (
          <Typography>No available rides at the moment. Check back later.</Typography>
        ) : (
          <Grid container spacing={3}>
            {rides.available.map(ride => (
              <Grid item xs={12} sm={6} md={4} key={ride.ride_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ride #{ride.ride_id}
                    </Typography>
                    
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap>
                        <strong>Pickup:</strong> {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}`}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Time:</strong> {new Date(ride.date_time).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Passengers:</strong> {ride.passenger_count}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        ${ride.fare_amount.toFixed(2)}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleAcceptRide(ride.ride_id)}
                      >
                        Accept
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}

export default AvailableRides;

