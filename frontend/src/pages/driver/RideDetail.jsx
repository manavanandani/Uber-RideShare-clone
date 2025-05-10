// src/pages/driver/RideDetail.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Check as CheckIcon,
  SportsScore as FinishIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ArrowBack as BackIcon,
  Money as MoneyIcon,
  Star as StarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';
import MapWithMarkers from '../../components/common/MapWithMarkers';
import api from '../../services/api';

function RideDetail() {
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
        // Get driver's rides
        const response = await driverService.getRideHistory(user.driver_id);
        
        // Find the specific ride
        const rideData = response.data.find(r => r.ride_id === rideId);
        
        if (!rideData) {
          setError('Ride not found');
          setLoading(false);
          return;
        }
        
        // If we need more detailed information including customer data
        // Make a second API call to get the complete ride details
        const detailResponse = await api.get(`/rides/${rideId}`);
        let detailedRide = detailResponse.data.data;
        console.log("Detailed ride with customer info:", detailedRide);
        
        setRide(detailedRide);
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
      const updatedRide = response.data.find(r => r.ride_id === rideId);
      if (updatedRide) {
        setRide(updatedRide);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  // Function to get status color
  const getStatusColor = (status) => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          Ride #{ride.ride_id}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip 
          label={ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
          color={getStatusColor(ride.status)}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
                    <strong>Pickup:</strong> {ride.pickup_location && ride.pickup_location.coordinates ? 
                      `${ride.pickup_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.pickup_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                      'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dropoff:</strong> {ride.dropoff_location && ride.dropoff_location.coordinates ? 
                      `${ride.dropoff_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.dropoff_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                      'N/A'}
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Fare:</strong> ${(ride.fare_amount || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, height: 300 }}>
              <MapWithMarkers 
                pickup={ride.pickup_location && ride.pickup_location.coordinates ? {
                  lat: ride.pickup_location.coordinates[1] || 0,
                  lng: ride.pickup_location.coordinates[0] || 0
                } : null}
                dropoff={ride.dropoff_location && ride.dropoff_location.coordinates ? {
                  lat: ride.dropoff_location.coordinates[1] || 0,
                  lng: ride.dropoff_location.coordinates[0] || 0
                } : null}
                showDirections={true}
                height={300}
              />
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trip Analytics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Distance</Typography>
                  <Typography variant="h5">
                    {ride.distance ? `${ride.distance.toFixed(2)} km` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Duration</Typography>
                  <Typography variant="h5">
                    {ride.duration ? `${Math.round(ride.duration)} mins` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Fare per km</Typography>
                  <Typography variant="h5">
                    {ride.distance && ride.fare_amount
                      ? `$${(ride.fare_amount / ride.distance).toFixed(2)}`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {ride.status === 'completed' && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Payment Details
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Base Fare:</strong> ${(ride.fare_amount * 0.3).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Distance Charge:</strong> ${(ride.distance * 1.5).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Time Charge:</strong> ${(ride.duration * 0.2).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Your Earnings:</strong> ${(ride.fare_amount * 0.8).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {ride.customer_info ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ width: 64, height: 64, mr: 2 }}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {ride.customer_info.phone}
                    </Typography>
                  </Box>
                )}

                {ride.status === 'completed' && !ride.rating?.driver_to_customer && (
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<StarIcon />}
                    onClick={() => setShowRatingDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    Rate Customer
                  </Button>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Customer information is unavailable.
              </Typography>
            )}
          </Paper>
          
          {ride.status === 'completed' && ride.rating?.customer_to_driver && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Rating
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ textAlign: 'center' }}>
                <Rating 
                  value={ride.rating.customer_to_driver} 
                  readOnly 
                  size="large"
                  precision={0.5} 
                />
                <Typography variant="h4" sx={{ my: 1 }}>
                  {ride.rating.customer_to_driver.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  This customer rated your service
                </Typography>
              </Box>
            </Paper>
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

export default RideDetail;