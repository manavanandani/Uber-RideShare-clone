import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function RideDetailView() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openMapDialog, setOpenMapDialog] = useState(false);
  
  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);
  
  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      // Get ride details
      const response = await api.get(`/rides/${rideId}`);
      setRide(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ride details');
      setLoading(false);
    }
  };
  
  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/rides/${rideId}`);
      setOpenDeleteDialog(false);
      navigate('/admin/rides');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ride');
    }
  };
  
  const handleViewMap = () => {
    setOpenMapDialog(true);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'accepted': return 'info';
      case 'requested': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
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
        Ride not found.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/rides')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Ride #{ride.ride_id}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip 
          label={ride.status} 
          color={getStatusColor(ride.status)}
          sx={{ mx: 1 }}
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date & Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(ride.date_time).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Customer ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.customer_id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Driver ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.driver_id || 'Not assigned yet'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fare Amount
                </Typography>
                <Typography variant="body1" gutterBottom>
                  ${ride.fare_amount?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Passengers
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.passenger_count || 1}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Distance
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.distance ? `${ride.distance.toFixed(2)} km` : 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Duration
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ride.duration ? `${Math.round(ride.duration)} mins` : 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Pickup Location
                </Typography>
                <Typography variant="body1" gutterBottom>
    {ride.pickup_location.coordinates 
      ? `${ride.pickup_location.coordinates[1].toFixed(4)}, ${ride.pickup_location.coordinates[0].toFixed(4)}`
      : `${ride.pickup_location.latitude?.toFixed(4) || 0}, ${ride.pickup_location.longitude?.toFixed(4) || 0}`}
  </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Dropoff Location
                </Typography>
                <Typography variant="body1" gutterBottom>
    {ride.dropoff_location.coordinates 
      ? `${ride.dropoff_location.coordinates[1].toFixed(4)}, ${ride.dropoff_location.coordinates[0].toFixed(4)}`
      : `${ride.dropoff_location.latitude?.toFixed(4) || 0}, ${ride.dropoff_location.longitude?.toFixed(4) || 0}`}
  </Typography>
              </Grid>
              
              {ride.surge_factor && ride.surge_factor > 1 && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Surge Factor
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {ride.surge_factor.toFixed(2)}x
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            <Button
              variant="outlined"
              startIcon={<LocationIcon />}
              onClick={handleViewMap}
              sx={{ mt: 3 }}
            >
              View on Map
            </Button>
          </Paper>
          
          {ride.rating && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ratings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Customer to Driver
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {ride.rating.customer_to_driver ? `${ride.rating.customer_to_driver.toFixed(1)} / 5.0` : 'Not rated'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Driver to Customer
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {ride.rating.driver_to_customer ? `${ride.rating.driver_to_customer.toFixed(1)} / 5.0` : 'Not rated'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                Delete Ride
              </Button>
              
              <Button
                variant="outlined"
                component="a"
                href={`/admin/billing?ride_id=${ride.ride_id}`}
              >
                View Associated Bill
              </Button>
              
              <Button
                variant="outlined"
                component="a"
                href={`/admin/customers/${ride.customer_id}`}
              >
                View Customer
              </Button>
              
              {ride.driver_id && (
                <Button
                  variant="outlined"
                  component="a"
                  href={`/admin/drivers/${ride.driver_id}`}
                >
                  View Driver
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete ride #{ride.ride_id}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Map Dialog */}
      <Dialog
        open={openMapDialog}
        onClose={() => setOpenMapDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ride Route</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400 }}>
          <MapWithMarkers
  pickup={{
    lat: ride.pickup_location.coordinates 
      ? ride.pickup_location.coordinates[1] 
      : ride.pickup_location.latitude,
    lng: ride.pickup_location.coordinates 
      ? ride.pickup_location.coordinates[0] 
      : ride.pickup_location.longitude
  }}
  dropoff={{
    lat: ride.dropoff_location.coordinates 
      ? ride.dropoff_location.coordinates[1] 
      : ride.dropoff_location.latitude,
    lng: ride.dropoff_location.coordinates 
      ? ride.dropoff_location.coordinates[0] 
      : ride.dropoff_location.longitude
  }}
  showDirections={true}
  height={400}
/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMapDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RideDetailView;