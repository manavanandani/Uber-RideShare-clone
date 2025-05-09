// frontend/src/pages/customer/RideTracking.jsx
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
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';
import { customerService } from '../../services/customerService';

function RideTracking() {
  const { rideId } = useParams();
  const { user } = useSelector(state => state.auth);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Initial load of ride details
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        // If you're a customer fetching your own ride
        const response = await api.get(`/rides/customer/${user.customer_id}`);
        
        // Find the specific ride
        let rideData = response.data.data.find(r => r.ride_id === rideId);
        
        if (!rideData) {
          setError('Ride not found');
          setLoading(false);
          return;
        }
        
        // Transform location data
        rideData = {
          ...rideData,
          pickup_location: rideData.pickup_location && {
            latitude: rideData.pickup_location.coordinates ? rideData.pickup_location.coordinates[1] : 0,
            longitude: rideData.pickup_location.coordinates ? rideData.pickup_location.coordinates[0] : 0
          },
          dropoff_location: rideData.dropoff_location && {
            latitude: rideData.dropoff_location.coordinates ? rideData.dropoff_location.coordinates[1] : 0,
            longitude: rideData.dropoff_location.coordinates ? rideData.dropoff_location.coordinates[0] : 0
          }
        };
        
        setRide(rideData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ride details');
        setLoading(false);
      }
    };
    
    if (rideId && user?.customer_id) {
      fetchRideDetails();
    }
  }, [rideId, user]);

  // Real-time status polling for active rides
  useEffect(() => {
    // Only set up polling if we have a ride and it's not completed
    if (ride && ride.status !== 'completed' && ride.status !== 'cancelled') {
      // Clear any existing interval first
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Set up a new polling interval
      const interval = setInterval(async () => {
        try {
          // Check if the ride status has updated
          const response = await api.get(`/rides/customer/${user.customer_id}/active`);
          
          if (response.data && response.data.data) {
            const updatedRide = {
              ...response.data.data,
              pickup_location: response.data.data.pickup_location && {
                latitude: response.data.data.pickup_location.coordinates ? response.data.data.pickup_location.coordinates[1] : 0,
                longitude: response.data.data.pickup_location.coordinates ? response.data.data.pickup_location.coordinates[0] : 0
              },
              dropoff_location: response.data.data.dropoff_location && {
                latitude: response.data.data.dropoff_location.coordinates ? response.data.data.dropoff_location.coordinates[1] : 0,
                longitude: response.data.data.dropoff_location.coordinates ? response.data.data.dropoff_location.coordinates[0] : 0
              }
            };
            
            // Only update if the ride ID matches and there's an actual change
            if (updatedRide.ride_id === rideId && 
                (updatedRide.status !== ride.status || 
                 JSON.stringify(updatedRide) !== JSON.stringify(ride))) {
              
              console.log('Ride status updated:', updatedRide.status);
              setRide(updatedRide);
              
              // If the ride is completed, stop polling and show rating dialog
              if (updatedRide.status === 'completed') {
                clearInterval(interval);
                setPollingInterval(null);
                
                // Only show rating dialog if not already rated
                if (!updatedRide.rating?.customer_to_driver) {
                  setShowRatingDialog(true);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error polling for ride updates:', err);
          // Don't set the error state to avoid disrupting the UI
          // Just log it and continue polling
        }
      }, 10000); // Poll every 10 seconds
      
      setPollingInterval(interval);
      
      // Clean up interval on component unmount
      return () => {
        clearInterval(interval);
      };
    }
  }, [ride, rideId, user?.customer_id]);

  // Auto-cancellation effect for long-waiting requested rides
  useEffect(() => {
    // Only set timeout for rides in 'requested' status
    if (ride && ride.status === 'requested') {
      // Calculate how long the ride has been in requested status
      const requestTime = new Date(ride.date_time).getTime();
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - requestTime;
      
      // If it's already been waiting for more than 5 minutes, don't set a new timer
      if (elapsedTime > 5 * 60 * 1000) {
        return; 
      }
      
      // Calculate remaining time until 5 minutes have passed
      const remainingTime = Math.max(0, 5 * 60 * 1000 - elapsedTime);
      
      // Set a timeout to show a warning after the remaining time
      const timeoutId = setTimeout(() => {
        // Ask user if they want to cancel the ride
        if (confirm('No drivers have accepted your ride yet. Would you like to cancel?')) {
          handleCancelRide();
        }
      }, remainingTime);
      
      // Clean up timeout on component unmount
      return () => clearTimeout(timeoutId);
    }
  }, [ride]);

  const handleRateDriver = async () => {
    try {
      await customerService.rateRide(rideId, rating, comment);
      setShowRatingDialog(false);
      
      // Refresh ride data to update rating
      const response = await api.get(`/rides/customer/${user.customer_id}`);
      const updatedRide = response.data.data.find(r => r.ride_id === rideId);
      if (updatedRide) {
        setRide(updatedRide);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handleCancelRide = async () => {
    try {
      setCancelling(true);
      await customerService.cancelRide(rideId, cancelReason);
      setShowCancelDialog(false);
      
      // Refresh ride data to update status
      const response = await api.get(`/rides/customer/${user.customer_id}`);
      const updatedRide = response.data.data.find(r => r.ride_id === rideId);
      if (updatedRide) {
        setRide(updatedRide);
      }
      
      setCancelling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel ride');
      setCancelling(false);
    }
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ride #{ride.ride_id}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stepper activeStep={
              ride.status === 'requested' ? 0 :
              ride.status === 'accepted' ? 1 :
              ride.status === 'in_progress' ? 2 :
              ride.status === 'completed' ? 3 : 
              ride.status === 'cancelled' ? -1 : 0
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
            
            {ride.status === 'cancelled' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                This ride was cancelled.
                {ride.cancellation_reason && ` Reason: ${ride.cancellation_reason.replace('_', ' ')}`}
              </Alert>
            )}
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
                    <strong>Pickup:</strong> {`${ride.pickup_location.latitude.toFixed(6)}, ${ride.pickup_location.longitude.toFixed(6)}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dropoff:</strong> {`${ride.dropoff_location.latitude.toFixed(6)}, ${ride.dropoff_location.longitude.toFixed(6)}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Pickup Time:</strong> {new Date(ride.date_time).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Passengers:</strong> {ride.passenger_count || 1}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, height: 300 }}>
              <MapWithMarkers 
                pickup={{
                  lat: ride.pickup_location.latitude,
                  lng: ride.pickup_location.longitude
                }}
                dropoff={{
                  lat: ride.dropoff_location.latitude,
                  lng: ride.dropoff_location.longitude
                }}
                showDirections={true}
                height={300}
              />
            </Box>
            // Continuing with the frontend/src/pages/customer/RideTracking.jsx component

            {/* Add Cancel Button for rides in requested or accepted status */}
            {(ride.status === 'requested' || ride.status === 'accepted') && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setShowCancelDialog(true)}
                  fullWidth
                >
                  Cancel Ride
                </Button>
              </Box>
            )}
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
                <Typography variant="body1">${(ride.fare_amount * 0.4).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Distance ({ride.distance?.toFixed(1) || '0.0'} km):</Typography>
                <Typography variant="body1">${(ride.distance * 1.5 || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Time ({ride.duration?.toFixed(0) || '0'} min):</Typography>
                <Typography variant="body1">${(ride.duration * 0.2 || 0).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total Fare:</Typography>
                <Typography variant="h6">${ride.fare_amount.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Payment Status:</Typography>
                <Typography variant="body2" color="success.main">
                  {ride.payment_status || 'Paid'}
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
              
              {ride.driver_id ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    {ride.driver_info?.first_name?.[0] || 'D'}
                  </Box>
                  <Box>
                    <Typography variant="body1">
                      {ride.driver_info?.first_name || 'Driver'} {ride.driver_info?.last_name || ''}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating 
                        value={ride.driver_info?.rating || 4.5} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {ride.driver_info?.rating?.toFixed(1) || '4.5'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {ride.status === 'cancelled' ? (
                    <Typography color="error">
                      This ride was cancelled.
                    </Typography>
                  ) : (
                    <Typography color="info.main">
                      Waiting for a driver to accept your ride...
                    </Typography>
                  )}
                </Box>
              )}
              
              {ride.driver_id && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CarIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {ride.driver_info?.car_details || 'Toyota Camry, White (ABC123)'}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                {ride.status === 'completed' && !ride.rating?.customer_to_driver && (
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => setShowRatingDialog(true)}
                  >
                    Rate Your Driver
                  </Button>
                )}
                
                {ride.status === 'requested' && (
                  <Typography color="warning.main">
                    Waiting for a driver to accept your ride...
                  </Typography>
                )}
                
                {ride.status === 'accepted' && (
                  <Typography color="info.main">
                    Driver has accepted your ride and is on the way to pick you up!
                  </Typography>
                )}
                
                {ride.status === 'in_progress' && (
                  <Typography color="primary.main">
                    You're on your way to your destination.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Your Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1" gutterBottom>
              How was your ride with {ride.driver_info?.first_name || 'your driver'}?
            </Typography>
            <Rating
              name="driver-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
              precision={0.5}
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Add a comment (optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>Cancel</Button>
          <Button onClick={handleRateDriver} disabled={!rating}>
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Ride Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Ride</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to cancel this ride?
              {ride.status === 'accepted' && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Note: Cancelling after a driver has accepted may incur a cancellation fee.
                </Typography>
              )}
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="cancelReason"
              label="Reason for cancellation (optional)"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Keep Ride
          </Button>
          <Button 
            onClick={handleCancelRide} 
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : 'Cancel Ride'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RideTracking;