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
import { billingService } from '../../services/billingService';

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
  const [billing, setBilling] = useState(null);

  const fetchBillingInfo = async (rideId) => {
    try {
      if (!user || !user.customer_id) return;
    
      const response = await billingService.getRideBilling(user.customer_id, rideId);
      if (response && response.data) {
        setBilling(response.data);
      } else {
        // If no bill exists yet, set billing to null
        setBilling(null);
      }
    } catch (err) {
      console.error('Error fetching billing information:', err);
      // Don't set error state to avoid disrupting the UI
      setBilling(null);
    }
  };

  // Initial load of ride details
  // In src/pages/customer/RideTracking.jsx

// Update the fetchRideDetails function in useEffect
useEffect(() => {
  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      
      // Make a direct call to get the specific ride with complete details
      const response = await api.get(`/rides/${rideId}`);
      
      if (!response.data || !response.data.data) {
        setError('Ride not found');
        setLoading(false);
        return;
      }
      
      const rideData = response.data.data;
      
      // Transform location data with proper null checks
      const formattedRide = {
        ...rideData,
        pickup_location: rideData.pickup_location && rideData.pickup_location.coordinates ? {
          latitude: typeof rideData.pickup_location.coordinates[1] === 'number' ? rideData.pickup_location.coordinates[1] : 0,
          longitude: typeof rideData.pickup_location.coordinates[0] === 'number' ? rideData.pickup_location.coordinates[0] : 0
        } : { latitude: 0, longitude: 0 },
        dropoff_location: rideData.dropoff_location && rideData.dropoff_location.coordinates ? {
          latitude: typeof rideData.dropoff_location.coordinates[1] === 'number' ? rideData.dropoff_location.coordinates[1] : 0,
          longitude: typeof rideData.dropoff_location.coordinates[0] === 'number' ? rideData.dropoff_location.coordinates[0] : 0
        } : { latitude: 0, longitude: 0 }
      };
      
      setRide(formattedRide);
      
      // Fetch billing information if ride exists
      if (formattedRide.ride_id) {
        await fetchBillingInfo(formattedRide.ride_id);
      }
      
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
          const response = await api.get(`/rides/${rideId}`);
          
          if (response.data && response.data.data) {
            // Use the direct ride endpoint instead of the active ride endpoint
            const updatedRideData = response.data.data;
            
            // Transform location data with proper null checks
            const updatedRide = {
              ...updatedRideData,
              pickup_location: updatedRideData.pickup_location && updatedRideData.pickup_location.coordinates ? {
                latitude: typeof updatedRideData.pickup_location.coordinates[1] === 'number' ? updatedRideData.pickup_location.coordinates[1] : 0,
                longitude: typeof updatedRideData.pickup_location.coordinates[0] === 'number' ? updatedRideData.pickup_location.coordinates[0] : 0
              } : { latitude: 0, longitude: 0 },
              dropoff_location: updatedRideData.dropoff_location && updatedRideData.dropoff_location.coordinates ? {
                latitude: typeof updatedRideData.dropoff_location.coordinates[1] === 'number' ? updatedRideData.dropoff_location.coordinates[1] : 0,
                longitude: typeof updatedRideData.dropoff_location.coordinates[0] === 'number' ? updatedRideData.dropoff_location.coordinates[0] : 0
              } : { latitude: 0, longitude: 0 }
            };
            
            // Only update if there's an actual change
            if (JSON.stringify(updatedRide) !== JSON.stringify(ride)) {
              console.log('Ride status updated:', updatedRide.status);
              setRide(updatedRide);
              
              // Also refresh billing info when ride status changes
              await fetchBillingInfo(updatedRide.ride_id);
              
              // If the ride is completed, stop polling and show rating dialog
              if (updatedRide.status === 'completed' || updatedRide.status === 'cancelled') {
                clearInterval(interval);
                setPollingInterval(null);
                
                // Only show rating dialog if not already rated and ride is completed
                if (updatedRide.status === 'completed' && !updatedRide.rating?.customer_to_driver) {
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
      }, 5000); // Poll every 5 seconds
      
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
      const updatedRideData = response.data.data.find(r => r.ride_id === rideId);
      
      if (updatedRideData) {
        // Make sure to transform the location data properly
        const transformedRide = {
          ...updatedRideData,
          pickup_location: updatedRideData.pickup_location && updatedRideData.pickup_location.coordinates ? {
            latitude: typeof updatedRideData.pickup_location.coordinates[1] === 'number' ? updatedRideData.pickup_location.coordinates[1] : 0,
            longitude: typeof updatedRideData.pickup_location.coordinates[0] === 'number' ? updatedRideData.pickup_location.coordinates[0] : 0
          } : { latitude: 0, longitude: 0 },
          dropoff_location: updatedRideData.dropoff_location && updatedRideData.dropoff_location.coordinates ? {
            latitude: typeof updatedRideData.dropoff_location.coordinates[1] === 'number' ? updatedRideData.dropoff_location.coordinates[1] : 0,
            longitude: typeof updatedRideData.dropoff_location.coordinates[0] === 'number' ? updatedRideData.dropoff_location.coordinates[0] : 0
          } : { latitude: 0, longitude: 0 }
        };
        
        setRide(transformedRide);
        
        // Also refresh billing info
        await fetchBillingInfo(transformedRide.ride_id);
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
                    <strong>Pickup:</strong> {
                      ride.pickup_location && 
                      typeof ride.pickup_location.latitude === 'number' && 
                      typeof ride.pickup_location.longitude === 'number' 
                        ? `${ride.pickup_location.latitude.toFixed(6)}, ${ride.pickup_location.longitude.toFixed(6)}`
                        : 'Location data unavailable'
                    }
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dropoff:</strong> {
                      ride.dropoff_location && 
                      typeof ride.dropoff_location.latitude === 'number' && 
                      typeof ride.dropoff_location.longitude === 'number'
                        ? `${ride.dropoff_location.latitude.toFixed(6)}, ${ride.dropoff_location.longitude.toFixed(6)}`
                        : 'Location data unavailable'
                    }
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
              {ride && 
               ride.pickup_location && ride.pickup_location.latitude && ride.pickup_location.longitude &&
               ride.dropoff_location && ride.dropoff_location.latitude && ride.dropoff_location.longitude ? (
                <MapWithMarkers 
                  pickup={{
                    lat: parseFloat(ride.pickup_location.latitude),
                    lng: parseFloat(ride.pickup_location.longitude)
                  }}
                  dropoff={{
                    lat: parseFloat(ride.dropoff_location.latitude),
                    lng: parseFloat(ride.dropoff_location.longitude)
                  }}
                  showDirections={true}
                  height={300}
                />
              ) : (
                <Box 
                  sx={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}
                >
                  <Typography align="center" color="text.secondary">
                    Map data unavailable
                  </Typography>
                </Box>
              )}
            </Box>

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
                <Typography variant="body1">
                  ${(ride.fare_amount ? (ride.fare_amount * 0.4) : 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  Distance ({(ride.distance || 0).toFixed(1)} km):
                </Typography>
                <Typography variant="body1">
                  ${((ride.distance || 0) * 1.5).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  Time ({(ride.duration || 0).toFixed(0)} min):
                </Typography>
                <Typography variant="body1">
                  ${((ride.duration || 0) * 0.2).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total Fare:</Typography>
                <Typography variant="h6">
                  ${(ride.fare_amount || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Payment Status:</Typography>
                <Typography variant="body2" color={
                  billing?.payment_status === 'paid' ? 'success.main' : 
                  billing?.payment_status === 'failed' ? 'error.main' : 'warning.main'
                }>
                  {billing?.payment_status ? billing.payment_status.charAt(0).toUpperCase() + billing.payment_status.slice(1) : 'Pending'}
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

               {ride.driver_id && ride.driver_info ? (
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
          {ride.driver_info.first_name?.[0] || 'D'}
        </Box>
        <Box>
          <Typography variant="body1">
            {ride.driver_info.first_name || ''} {ride.driver_info.last_name || ''}
          </Typography>
          {ride.driver_info.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating 
                value={ride.driver_info.rating} 
                precision={0.5} 
                readOnly 
                size="small"
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {ride.driver_info.rating.toFixed(1)}
              </Typography>
            </Box>
          )}
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
    
    {ride.driver_id && ride.driver_info && (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CarIcon sx={{ mr: 1 }} />
        <Typography variant="body2">
          {ride.driver_info.car_details || 'Vehicle information not available'}
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