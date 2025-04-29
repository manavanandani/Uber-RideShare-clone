// src/pages/driver/RideDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Person as PersonIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function RideDetails() {
  const { rideId } = useParams();
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        // Get all rides for this driver
        const response = await driverService.getRideHistory(user.driver_id);
        
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
    
    if (rideId && user?.driver_id) {
      fetchRideDetails();
    }
  }, [rideId, user]);

  const handleRateCustomer = async () => {
    try {
      await driverService.rateCustomer(rideId, rating, comment);
      setShowRatingDialog(false);
      
      // Refresh ride data to update rating
      const response = await driverService.getRideHistory(user.driver_id);
      const updatedRide = response.data.data.find(r => r.ride_id === rideId);
      if (updatedRide) {
        setRide(updatedRide);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handleAction = async (action) => {
    try {
      switch (action) {
        case 'accept':
          await driverService.acceptRide(rideId);
          break;
        case 'start':
          await driverService.startRide(rideId);
          break;
        case 'complete':
          await driverService.completeRide(rideId);
          // Also create a bill
          await driverService.createBill(rideId);
          break;
        default:
          return;
      }
      
      // Refresh ride data
      const response = await driverService.getRideHistory(user.driver_id);
      const updatedRide = response.data.data.find(r => r.ride_id === rideId);
      if (updatedRide) {
        setRide(updatedRide);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} ride`);
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
              ride.status === 'completed' ? 3 : 0
            }>
              <Step key="requested">
                <StepLabel>Requested</StepLabel>
              </Step>
              <Step key="accepted">
                <StepLabel>Accepted</StepLabel>
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
                    <strong>Pickup:</strong> {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dropoff:</strong> {`${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}`}
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
                <Typography variant="body2" color="textSecondary">You Earn:</Typography>
                <Typography variant="body2" color="success.main">
                  ${(ride.fare_amount * 0.8).toFixed(2)} (80%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Customer ID
                </Typography>
                <Typography variant="body1">
                  {ride.customer_id}
                </Typography>
              </Box>
              
              {ride.status === 'completed' && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Your Rating
                  </Typography>
                  {ride.rating?.driver_to_customer ? (
                    <Rating 
                      value={ride.rating.driver_to_customer} 
                      readOnly 
                      precision={0.5}
                    />
                  ) : (
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => setShowRatingDialog(true)}
                    >
                      Rate Customer
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Action Card based on ride status */}
          {ride.status !== 'completed' && ride.status !== 'cancelled' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ride Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {ride.status === 'requested' && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => handleAction('accept')}
                  >
                    Accept Ride
                  </Button>
                )}
                
                {ride.status === 'accepted' && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => handleAction('start')}
                  >
                    Start Ride
                  </Button>
                )}
                
                {ride.status === 'in_progress' && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth
                    onClick={() => handleAction('complete')}
                  >
                    Complete Ride
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      
      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1" gutterBottom>
              How was your experience with this customer?
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
          <Button onClick={() => setShowRatingDialog(false)}>Cancel</Button>
          <Button onClick={handleRateCustomer} disabled={!rating}>
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RideDetails;