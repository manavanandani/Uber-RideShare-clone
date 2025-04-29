// src/pages/customer/RideTracking.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Rating
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function RideTracking() {
  const { rideId } = useParams();
  const { user } = useSelector(state => state.auth);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        // If you're a customer fetching your own ride
        const response = await api.get(`/rides/customer/${user.customer_id}`);
        
        // Find the specific ride
        const rideData = response.data.data.find(r => r.ride_id === rideId);
        
        if (!rideData) {
          setError('Ride not found');
          setLoading(false);
          return;
        }
        
        setRide(rideData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ride details');
        setLoading(false);
      }
    };
    
    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId, user]);

  // Function to get step status
  const getStepStatus = (rideStatus, step) => {
    const statusOrder = {
      'requested': 0,
      'accepted': 1,
      'in_progress': 2,
      'completed': 3,
      'cancelled': -1
    };
    
    const currentStatusIndex = statusOrder[rideStatus];
    const stepIndex = step;
    
    if (currentStatusIndex === -1) return 'error'; // Cancelled ride
    if (stepIndex < currentStatusIndex) return 'completed';
    if (stepIndex === currentStatusIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!ride) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No ride details found for ID: {rideId}
      </Alert>
    );
  }

  // Mock ride for now
  const mockRide = {
    ride_id: rideId || '123-45-6789',
    pickup_location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    dropoff_location: {
      latitude: 37.8049,
      longitude: -122.4394
    },
    date_time: new Date().toISOString(),
    customer_id: user?.customer_id || '123-45-6789',
    driver_id: '123-45-6780',
    fare_amount: 25.50,
    status: 'in_progress',
    distance: 5.2,
    duration: 15,
    driver_details: {
      first_name: 'John',
      last_name: 'Doe',
      car_details: '2022 Toyota Camry, White (ABC123)',
      rating: 4.8
    }
  };

  // Use mock data for demonstration
  const currentRide = ride || mockRide;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ride #{currentRide.ride_id}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stepper activeStep={
              currentRide.status === 'requested' ? 0 :
              currentRide.status === 'accepted' ? 1 :
              currentRide.status === 'in_progress' ? 2 :
              currentRide.status === 'completed' ? 3 : 0
            }>
              <Step key="requested">
                <StepLabel>Requested</StepLabel>
              </Step>
              <Step key="accepted">
                <StepLabel>Driver Accepted</StepLabel>
              </Step>
              <Step key="in_progress">
                <StepLabel>In Progress</StepLabel>
              </Step>
              <Step key="completed">
                <StepLabel>Completed</StepLabel>
              </Step>
            </Stepper>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trip Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Pickup:</strong> {`${currentRide.pickup_location.latitude.toFixed(4)}, ${currentRide.pickup_location.longitude.toFixed(4)}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dropoff:</strong> {`${currentRide.dropoff_location.latitude.toFixed(4)}, ${currentRide.dropoff_location.longitude.toFixed(4)}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Pickup Time:</strong> {new Date(currentRide.date_time).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Passengers:</strong> {currentRide.passenger_count || 1}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, height: 300 }}>
              <MapWithMarkers 
                pickup={{
                  lat: currentRide.pickup_location.latitude,
                  lng: currentRide.pickup_location.longitude
                }}
                dropoff={{
                  lat: currentRide.dropoff_location.latitude,
                  lng: currentRide.dropoff_location.longitude
                }}
                showDirections={true}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fare Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Base Fare:</Typography>
                <Typography variant="body1">${(currentRide.fare_amount * 0.4).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Distance ({currentRide.distance} km):</Typography>
                <Typography variant="body1">${(currentRide.distance * 1.5).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Time ({currentRide.duration} min):</Typography>
                <Typography variant="body1">${(currentRide.duration * 0.2).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total Fare:</Typography>
                <Typography variant="h6">${currentRide.fare_amount.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Payment Status:</Typography>
                <Typography variant="body2" color="success.main">
                  {currentRide.payment_status || 'Paid'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Driver Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  {currentRide.driver_details?.first_name?.[0] || 'D'}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {currentRide.driver_details?.first_name} {currentRide.driver_details?.last_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating 
                      value={currentRide.driver_details?.rating || 4.5} 
                      precision={0.5} 
                      readOnly 
                      size="small"
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {currentRide.driver_details?.rating || 4.5}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CarIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {currentRide.driver_details?.car_details || 'Toyota Camry, White (ABC123)'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {currentRide.status === 'completed' && !currentRide.rating?.customer_to_driver && (
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => setShowRatingDialog(true)}
                  >
                    Rate Your Driver
                  </Button>
                )}
                
                {currentRide.status === 'requested' && (
                  <Typography color="warning.main">
                    Waiting for a driver to accept your ride...
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Temporary Avatar component since it wasn't imported
const Avatar = ({ children, sx = {} }) => (
  <Box 
    sx={{ 
      width: 40, 
      height: 40, 
      borderRadius: '50%', 
      bgcolor: 'primary.main', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      ...sx
    }}
  >
    {children}
  </Box>
);

export default RideTracking;