// src/pages/admin/RideDetailView.jsx
import { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function RideDetailView() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        
        // Get ride details
        const response = await api.get(`/rides/${rideId}`);
        if (!response.data || !response.data.data) {
          setError('Ride not found');
          setLoading(false);
          return;
        }
        
        const rideData = response.data.data;
        setRide(rideData);
        
        // Try to get associated billing record
        try {
          const billingResponse = await api.get(`/billing/search?ride_id=${rideId}`);
          if (billingResponse.data && billingResponse.data.data && billingResponse.data.data.length > 0) {
            setBilling(billingResponse.data.data[0]);
          }
        } catch (billingErr) {
          console.log('No billing record found for this ride');
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ride details');
        setLoading(false);
      }
    };
    
    fetchRideDetails();
  }, [rideId]);

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
              Ride Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2">Pickup Location</Typography>
                    <Typography variant="body2">
                      {ride.pickup_location && ride.pickup_location.coordinates ? 
                        `${ride.pickup_location.coordinates[1]?.toFixed(6)}, ${ride.pickup_location.coordinates[0]?.toFixed(6)}` : 
                        'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2">Dropoff Location</Typography>
                    <Typography variant="body2">
                      {ride.dropoff_location && ride.dropoff_location.coordinates ? 
                        `${ride.dropoff_location.coordinates[1]?.toFixed(6)}, ${ride.dropoff_location.coordinates[0]?.toFixed(6)}` : 
                        'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <TimeIcon sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2">Date & Time</Typography>
                    <Typography variant="body2">
                      {new Date(ride.date_time).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2">Passengers</Typography>
                    <Typography variant="body2">
                      {ride.passenger_count || 1}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <MoneyIcon sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2">Fare</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${(ride.fare_amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {ride.distance && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <CarIcon sx={{ mr: 1, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2">Distance & Duration</Typography>
                      <Typography variant="body2">
                        {ride.distance.toFixed(2)} km ({Math.round(ride.duration || 0)} mins)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              
              {ride.cancellation_reason && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2">Cancellation Reason</Typography>
                    <Typography variant="body2">
                      {ride.cancellation_reason.replace(/_/g, ' ')}
                      {ride.cancellation_time && ` (${new Date(ride.cancellation_time).toLocaleString()})`}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Map View
              </Typography>
              <Box sx={{ height: 300 }}>
                {ride.pickup_location && ride.pickup_location.coordinates && 
                 ride.dropoff_location && ride.dropoff_location.coordinates ? (
                  <MapWithMarkers
                    pickup={{
                      lat: ride.pickup_location.coordinates[1],
                      lng: ride.pickup_location.coordinates[0]
                    }}
                    dropoff={{
                      lat: ride.dropoff_location.coordinates[1],
                      lng: ride.dropoff_location.coordinates[0]
                    }}
                    showDirections={true}
                    height={300}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'grey.100' }}>
                    <Typography color="textSecondary">Map data unavailable</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
          
          {billing && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Billing Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Base Fare</TableCell>
                      <TableCell align="right">${billing.breakdown?.base_fare?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Distance Fare</TableCell>
                      <TableCell align="right">${billing.breakdown?.distance_fare?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Time Fare</TableCell>
                      <TableCell align="right">${billing.breakdown?.time_fare?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                    {billing.breakdown?.surge_multiplier > 1 && (
                      <TableRow>
                        <TableCell>Surge Multiplier</TableCell>
                        <TableCell align="right">{billing.breakdown.surge_multiplier.toFixed(1)}x</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${billing.total_amount?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">
                  Payment Status: 
                  <Chip 
                    label={billing.payment_status.charAt(0).toUpperCase() + billing.payment_status.slice(1)}
                    color={billing.payment_status === 'completed' ? 'success' : (billing.payment_status === 'failed' ? 'error' : 'warning')}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="subtitle2">
                  Payment Method: {billing.payment_method.replace('_', ' ')}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Customer Card */}
          {ride.customer_info && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    {ride.customer_info.first_name?.[0] || 'C'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {ride.customer_info.first_name} {ride.customer_info.last_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {ride.customer_info.customer_id}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ ml: 2 }}>
                  {ride.customer_info.phone && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {ride.customer_info.phone}
                    </Typography>
                  )}
                  
                  {ride.customer_info.email && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {ride.customer_info.email}
                    </Typography>
                  )}
                  
                  {ride.customer_info.rating !== undefined && (
                    <Typography variant="body2">
                      <strong>Rating:</strong> {ride.customer_info.rating.toFixed(1)}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/admin/customers/${ride.customer_info.customer_id}`)}
                  >
                    View Full Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* Driver Card */}
          {ride.driver_info && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Driver Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {ride.driver_info.first_name?.[0] || 'D'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {ride.driver_info.first_name} {ride.driver_info.last_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {ride.driver_info.driver_id}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ ml: 2 }}>
                  {ride.driver_info.phone && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {ride.driver_info.phone}
                    </Typography>
                  )}
                  
                  {ride.driver_info.car_details && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Vehicle:</strong> {ride.driver_info.car_details}
                    </Typography>
                  )}
                  
                  {ride.driver_info.rating !== undefined && (
                    <Typography variant="body2">
                      <strong>Rating:</strong> {ride.driver_info.rating.toFixed(1)}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/admin/drivers/${ride.driver_info.driver_id}`)}
                  >
                    View Full Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* No driver assigned yet */}
          {!ride.driver_info && ride.status === 'requested' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No driver has been assigned to this ride yet.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default RideDetailView;