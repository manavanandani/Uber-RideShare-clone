// src/pages/driver/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Rating
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import api from '../../services/api';

function DriverDashboard() {
  const { user } = useSelector(state => state.auth);
  const [driverData, setDriverData] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        
        // Get driver profile
        const profileResponse = await api.get(`/drivers/${user.driver_id}`);
        
        // Get driver rides
        const ridesResponse = await api.get(`/rides/driver/${user.driver_id}`);
        
        setDriverData({
          profile: profileResponse.data.data,
          rides: ridesResponse.data.data,
          stats: {
            totalRides: ridesResponse.data.data.length,
            completedRides: ridesResponse.data.data.filter(ride => ride.status === 'completed').length,
            totalEarnings: ridesResponse.data.data
              .filter(ride => ride.status === 'completed')
              .reduce((total, ride) => total + ride.fare_amount, 0),
            rating: profileResponse.data.data.rating || 0
          }
        });
        
        // Set availability state from profile data
        setIsAvailable(profileResponse.data.data.status === 'available');
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load driver data');
        setLoading(false);
      }
    };
    
    if (user?.driver_id) {
      fetchDriverData();
    }
  }, [user]);

  const handleAvailabilityToggle = async () => {
    try {
      const newStatus = isAvailable ? 'offline' : 'available';
      
      // Get current location if becoming available
      let locationData = {};
      if (newStatus === 'available') {
        if (navigator.geolocation) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      }
      
      // Update driver status
      await api.patch(`/drivers/${user.driver_id}/status`, {
        status: newStatus,
        ...locationData
      });
      
      setIsAvailable(!isAvailable);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability');
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
  
  if (!driverData) {
    return null;
  }

  const recentRides = driverData.rides.slice(0, 5); // Get 5 most recent rides

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Driver Dashboard
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={isAvailable}
              onChange={handleAvailabilityToggle}
              color="primary"
            />
          }
          label={isAvailable ? "Available for Rides" : "Offline"}
        />
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Rides
                </Typography>
                <Typography variant="h4">
                  {driverData.stats.totalRides}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4">
                  {driverData.stats.completedRides}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <MoneyIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Earnings
                </Typography>
                <Typography variant="h4">
                  ${driverData.stats.totalEarnings.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <StarIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 1 }}>
                    {driverData.stats.rating.toFixed(1)}
                  </Typography>
                  <Rating 
                    value={driverData.stats.rating} 
                    readOnly 
                    precision={0.5}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Rides & Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Rides
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentRides.length === 0 ? (
              <Typography>No rides yet. Set yourself as available to start receiving ride requests.</Typography>
            ) : (
              <List>
                {recentRides.map((ride) => (
                  <ListItem key={ride.ride_id} divider>
                    <ListItemText
                      primary={`Ride #${ride.ride_id}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {new Date(ride.date_time).toLocaleString()}
                          </Typography>
                          <br />
                          {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)} → 
                            ${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}`}
                          <br />
                          {`Status: ${ride.status}`}
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="h6">${ride.fare_amount.toFixed(2)}</Typography>
                      <Button 
                        component={Link} 
                        to={`/driver/ride/${ride.ride_id}`}
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                component={Link} 
                to="/driver/rides"
                variant="outlined"
              >
                View All Rides
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Name
              </Typography>
              <Typography variant="body1">
                {`${driverData.profile.first_name} ${driverData.profile.last_name}`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Email
              </Typography>
              <Typography variant="body1">
                {driverData.profile.email}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Phone
              </Typography>
              <Typography variant="body1">
                {driverData.profile.phone}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Car Details
              </Typography>
              <Typography variant="body1">
                {driverData.profile.car_details}
              </Typography>
            </Box>
            
            <Button 
              component={Link} 
              to="/driver/profile"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Update Profile
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DriverDashboard;