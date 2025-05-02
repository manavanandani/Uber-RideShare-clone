// src/pages/driver/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
  Rating,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Star as StarIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function DriverDashboard() {
  const { user } = useSelector(state => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(user?.status === 'available');

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not get your current location.");
        }
      );
    }
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get driver profile
        const profileResponse = await driverService.getProfile(user.driver_id);
        
        // Get ride history
        const historyResponse = await driverService.getRideHistory(user.driver_id);
        
        // Get earnings data
        const earningsResponse = await driverService.getEarnings(user.driver_id);
        
        // Combine data for dashboard
        setDashboard({
          profile: profileResponse.data,
          rides: historyResponse.data || [],
          earnings: earningsResponse.data || { 
            today: 0,
            week: 0,
            month: 0,
            total: 0
          },
          stats: {
            totalRides: historyResponse.data ? historyResponse.data.length : 0,
            completedRides: historyResponse.data ? historyResponse.data.filter(r => r.status === 'completed').length : 0,
            rating: profileResponse.data.rating || 0,
            activeRide: historyResponse.data ? historyResponse.data.find(r => ['accepted', 'in_progress'].includes(r.status)) : null
          }
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    if (user?.driver_id) {
      fetchDashboardData();
    }
  }, [user]);

  const handleToggleStatus = async (event) => {
    const newStatus = event.target.checked ? 'available' : 'offline';
    try {
      if (!location) {
        setError("Cannot go online without location access.");
        return;
      }
      
      await driverService.updateStatus(user.driver_id, newStatus, location);
      setIsOnline(event.target.checked);
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update your status');
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
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">Error</Typography>
          <Typography>{error}</Typography>
        </Paper>
      </Box>
    );
  }
  
  if (!dashboard) {
    return null;
  }

  const recentRides = dashboard.rides.slice(0, 5); // Get 5 most recent rides

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {dashboard.profile.first_name}!
      </Typography>
      
      <Grid container spacing={3}>
        {/* Driver Status Toggle */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Driver Status</Typography>
              <Typography variant="body1" color={isOnline ? 'success.main' : 'text.secondary'}>
                {isOnline ? 'You are online and available for rides' : 'You are currently offline'}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isOnline}
                  onChange={handleToggleStatus}
                  color="primary"
                />
              }
              label={isOnline ? "Online" : "Offline"}
            />
          </Paper>
        </Grid>
        
        {/* Active Ride Alert (if any) */}
        {dashboard.stats.activeRide && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Active Ride</Typography>
                  <Typography variant="body1">
                    You have an ongoing ride. Status: {dashboard.stats.activeRide.status}
                  </Typography>
                </Box>
                <Button 
                  component={Link} 
                  to={`/driver/rides/active`}
                  variant="contained" 
                  color="secondary"
                >
                  Manage Ride
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
        
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rides
                  </Typography>
                  <Typography variant="h4">{dashboard.stats.totalRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Today's Earnings
                  </Typography>
                  <Typography variant="h4">${dashboard.earnings.today?.toFixed(2) || '0.00'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Rides
                  </Typography>
                  <Typography variant="h4">{dashboard.stats.completedRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Your Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ mr: 1 }}>
                      {dashboard.stats.rating.toFixed(1)}
                    </Typography>
                    <Rating 
                      value={dashboard.stats.rating} 
                      readOnly 
                      precision={0.5} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Map Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Location
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 300 }}>
                {location ? (
                  <MapWithMarkers
                    pickup={{
                      lat: location.latitude,
                      lng: location.longitude
                    }}
                    height={300}
                  />
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    bgcolor: 'grey.100'
                  }}>
                    <Typography>Location not available. Please enable location services.</Typography>
                  </Box>
                )}
              </Box>
              
              {location && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Current coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Earnings Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                <ListItem divider>
                  <ListItemText primary="Today" />
                  <Typography variant="h6">${dashboard.earnings.today?.toFixed(2) || '0.00'}</Typography>
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="This Week" />
                  <Typography variant="h6">${dashboard.earnings.week?.toFixed(2) || '0.00'}</Typography>
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="This Month" />
                  <Typography variant="h6">${dashboard.earnings.month?.toFixed(2) || '0.00'}</Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Total Earnings" />
                  <Typography variant="h6">${dashboard.earnings.total?.toFixed(2) || '0.00'}</Typography>
                </ListItem>
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  component={Link} 
                  to="/driver/earnings"
                  variant="outlined"
                >
                  View Detailed Earnings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Rides */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Rides
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentRides.length === 0 ? (
                <Typography>No rides yet. Go online to start accepting rides!</Typography>
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
                            {`Status: ${ride.status}`}
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="h6">${ride.fare_amount?.toFixed(2) || '0.00'}</Typography>
                        <Button 
                          component={Link} 
                          to={`/driver/history/${ride.ride_id}`}
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
                  to="/driver/history"
                  variant="outlined"
                >
                  View All Rides
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DriverDashboard;