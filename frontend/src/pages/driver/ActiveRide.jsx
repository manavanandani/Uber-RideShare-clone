// src/pages/driver/ActiveRide.jsx
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Check as CheckIcon,
  SportsScore as FinishIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function ActiveRide() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // Add these states for cancellation functionality
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Use a ref to track the polling interval
  const pollingIntervalRef = useRef(null);
  // Add a ref to track if a fetch is in progress to prevent overlapping calls
  const fetchInProgressRef = useRef(false);
  // Add a ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Ride steps based on status
  const steps = [
    { label: 'Ride Accepted', description: 'You have accepted the ride request.' },
    { label: 'Pickup Customer', description: 'Drive to the pickup location and meet your passenger.' },
    { label: 'In Progress', description: 'Navigate to the destination.' },
    { label: 'Completed', description: 'Ride completed successfully.' }
  ];

  // Function to check if a ride object is valid and has necessary data
  const isValidRide = (rideData) => {
    return rideData && 
           rideData.ride_id && 
           rideData.status && 
           ['accepted', 'in_progress', 'completed'].includes(rideData.status);
  };

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      
      // Clear any polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current) return;
          
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(currentLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  const fetchActiveRide = async () => {
    // If fetch is already in progress, skip this one
    if (fetchInProgressRef.current || !isMountedRef.current) return;
    
    try {
      fetchInProgressRef.current = true;
      
      if (!isMountedRef.current) return;
      
      // Only show loading on first fetch
      if (!ride) setLoading(true);
      
      console.log('Fetching active ride for driver:', user.driver_id);
      const response = await driverService.getActiveRide(user.driver_id);
      console.log('Active ride response:', response);
      
      if (!isMountedRef.current) return;
      
      // Check if we have a valid response with actual ride data
      if (response && response.data && isValidRide(response.data)) {
        console.log('Valid active ride found:', response.data);
        
        // Format locations for the map component with careful null handling
        const formattedRide = {
          ...response.data,
          pickup_location: response.data.pickup_location && response.data.pickup_location.coordinates ? {
            latitude: response.data.pickup_location.coordinates[1],
            longitude: response.data.pickup_location.coordinates[0]
          } : null,
          dropoff_location: response.data.dropoff_location && response.data.dropoff_location.coordinates ? {
            latitude: response.data.dropoff_location.coordinates[1],
            longitude: response.data.dropoff_location.coordinates[0]
          } : null
        };
        
        // Only update state if something changed
        if (!ride || ride.ride_id !== formattedRide.ride_id || ride.status !== formattedRide.status) {
          setRide(formattedRide);
          
          // Set the active step based on ride status
          if (formattedRide.status === 'accepted') {
            setActiveStep(1); // Pickup customer
          } else if (formattedRide.status === 'in_progress') {
            setActiveStep(2); // In progress
          } else if (formattedRide.status === 'completed') {
            setActiveStep(3); // Completed
            
            // Clear polling on completed ride
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } else {
        // No valid ride found or empty response
        console.log('No valid active ride found');
        setRide(null);
        
        // Clear polling if no valid ride
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Update driver status to available if set to busy incorrectly
        if (user && user.driver_id && user.status === 'busy' && location) {
          try {
            console.log('Resetting driver status from busy to available');
            await driverService.updateStatus(user.driver_id, 'available', location);
          } catch (statusErr) {
            console.error('Failed to update driver status:', statusErr);
          }
        }
      }
      
      if (!isMountedRef.current) return;
      setLoading(false);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading active ride:', err);
      setError(err.response?.data?.message || 'Failed to load active ride');
      setLoading(false);
      
      // Don't set ride to null if we already have one - keep showing the last known state
      if (!ride) setRide(null);
    } finally {
      fetchInProgressRef.current = false;
    }
  };
  
  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.driver_id) {
      fetchActiveRide();
      
      // Set up polling - only once
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          // Only poll if the ride is not completed
          if (ride && ride.status !== 'completed') {
            fetchActiveRide();
          } else if (!ride) {
            // If there's no ride, poll a few times then stop
            const checkCount = 3;
            let currentCheck = 0;
            
            const checkInterval = setInterval(() => {
              currentCheck++;
              fetchActiveRide();
              
              if (currentCheck >= checkCount) {
                clearInterval(checkInterval);
                
                // If we still don't have a ride after checks, clear polling
                if (!ride && pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
              }
            }, 5000);
            
            return () => clearInterval(checkInterval);
          }
        }, 15000); // Reduced polling frequency to 15 seconds
      }
      
      // Cleanup on unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [user]);

  const handleStartRide = async () => {
    if (!ride) return;
    
    try {
      setUpdating(true);
      await driverService.startRide(ride.ride_id);
      
      // Update local state
      setRide(prev => ({ ...prev, status: 'in_progress' }));
      setActiveStep(2);
      setUpdating(false);
      
      // Fetch the latest state immediately after update
      setTimeout(() => fetchActiveRide(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start ride');
      setUpdating(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!ride) return;
    
    try {
      setUpdating(true);
      console.log('Attempting to complete ride:', ride.ride_id);
      
      const response = await driverService.completeRide(ride.ride_id);
      console.log('Ride completed response:', response);
      
      // Update local state
      setRide(prev => ({ ...prev, status: 'completed' }));
      setActiveStep(3);
      
      // Clear polling when ride is completed
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Update driver status back to available
      await driverService.getProfile(user.driver_id);

      setUpdating(false);
      
      // Show rating dialog
      setShowRatingDialog(true);
    } catch (err) {
      console.error('Error completing ride:', err);
      // More detailed error handling
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(err.response.data?.message || `Error ${err.response.status}: Failed to complete ride`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message}`);
      }
      setUpdating(false);
    }
  };

  const handleRateCustomer = async () => {
    try {
      await driverService.rateCustomer(ride.ride_id, rating, comment);
      setShowRatingDialog(false);
      
      // Navigate to dashboard after rating
      navigate('/driver');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;
    
    try {
      setCancelling(true);
      await driverService.cancelRide(ride.ride_id, cancelReason);
      setShowCancelDialog(false);
      
      // Clear polling when ride is cancelled
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Navigate back to dashboard after cancellation
      navigate('/driver');
      
      setCancelling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel ride');
      setCancelling(false);
    }
  };

  // Function to get status color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'accepted':
        return 'info';
      case 'requested':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If no valid ride is found, show message and button
  if (!ride || !isValidRide(ride)) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          You don't have any active rides right now.
        </Alert>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/driver/rides/available')}
          startIcon={<CarIcon />}
        >
          Find Available Rides
        </Button>
      </Box>
    );
  }

  // Rest of the component...
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Active Ride
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ride #{ride.ride_id || 'N/A'}</Typography>
              <Chip 
                label={ride.status ? ride.status.charAt(0).toUpperCase() + ride.status.slice(1) : 'Unknown'}
                color={getStatusColor(ride.status)}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                  <StepContent>
                    <Typography>{step.description}</Typography>
                    <Box sx={{ mb: 2, mt: 1 }}>
                      {index === 1 && ride?.status === 'accepted' && (
                        // Add both Start Ride and Cancel Ride buttons in the accepted state
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            onClick={handleStartRide}
                            disabled={updating}
                            startIcon={<CarIcon />}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {updating ? <CircularProgress size={24} /> : 'Start Ride'}
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={updating}
                            startIcon={<CancelIcon />}
                            sx={{ mt: 1 }}
                          >
                            Cancel Ride
                          </Button>
                        </Box>
                      )}
                      {index === 2 && ride?.status === 'in_progress' && (
                        <Button
                          variant="contained"
                          onClick={handleCompleteRide}
                          disabled={updating}
                          startIcon={<FinishIcon />}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          {updating ? <CircularProgress size={24} /> : 'Complete Ride'}
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            {ride?.status === 'completed' && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <CheckIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" color="success.main">
                  Ride Completed Successfully
                </Typography>
                <Typography variant="body2">
                  Fare: ${(ride.fare_amount || 0).toFixed(2)}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/driver')}
                >
                  Return to Dashboard
                </Button>
              </Box>
            )}
          </Paper>
          
          {/* Customer Information Card */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {ride?.customer_info ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
  sx={{ mr: 2 }}
  src={ride.customer_info?.intro_media?.image_urls?.length > 0 
    ? `http://localhost:5000${ride.customer_info.intro_media.image_urls[0]}` 
    : ''}
>
  {ride.customer_info?.first_name?.[0] || 'C'}
</Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {ride.customer_info.first_name || ''} {ride.customer_info.last_name || ''}
                    </Typography>
                    {ride.customer_info.rating !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating 
                          value={ride.customer_info.rating || 0} 
                          precision={0.5} 
                          readOnly 
                          size="small"
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {(ride.customer_info.rating || 0).toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                {ride.customer_info.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {ride.customer_info.phone}
                    </Typography>
                  </Box>
                )}
                
                {ride?.status === 'completed' && !ride?.rating?.driver_to_customer && (
                  <Button 
                    variant="outlined" 
                    fullWidth
                    //startIcon={<StarIcon />}
                    onClick={() => setShowRatingDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    Rate Customer
                  </Button>
                )}
                
                {ride?.rating?.driver_to_customer && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Your Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating 
                        value={ride.rating.driver_to_customer} 
                        readOnly 
                        precision={0.5}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {ride.rating.driver_to_customer.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Customer information is unavailable.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Pickup Location</Typography>
                <Typography variant="body2" gutterBottom>
                  {ride.pickup_location ? 
                    `${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}` : 
                    'Location data unavailable'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Drop-off Location</Typography>
                <Typography variant="body2" gutterBottom>
                  {ride.dropoff_location ? 
                    `${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}` : 
                    'Location data unavailable'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Ride Time</Typography>
                <Typography variant="body2" gutterBottom>
                  {ride.date_time ? new Date(ride.date_time).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Passengers</Typography>
                <Typography variant="body2" gutterBottom>
                  {ride.passenger_count || 1}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Fare Amount</Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ${(ride.fare_amount || 0).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Estimated Distance</Typography>
                <Typography variant="body2" gutterBottom>
                  {ride.distance ? `${ride.distance.toFixed(2)} km` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Navigation
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              {ride.pickup_location && ride.dropoff_location ? (
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
                  markers={location ? [
                    {
                      position: {
                        lat: location.latitude,
                        lng: location.longitude
                      },
                      title: 'Your Location'
                    }
                  ] : []}
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
            
            {location && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Your current location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Your Passenger</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1" gutterBottom>
              How was your experience with this passenger?
            </Typography>
            <Rating
              name="customer-rating"
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
          <Button onClick={() => navigate('/driver')}>Skip</Button>
          <Button onClick={handleRateCustomer} disabled={!rating} color="primary">
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
            </Typography>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Cancelling rides may affect your acceptance rate and driver rating.
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

export default ActiveRide;