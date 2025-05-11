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
  // const [isOnline, setIsOnline] = useState(user?.status === 'available');

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
          let message = "Could not get your current location.";
          if (error.code === 1) message = "Location permission denied. Please allow location access in your browser.";
          if (error.code === 2) message = "Location unavailable. Please check your device settings.";
          if (error.code === 3) message = "Location request timed out. Please try again.";
          setError(message);
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
    <Box sx={{ bgcolor: '#f7f7f7', minHeight: '100vh' }}>
      {/* Hero Banner/Illustration */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 1 }}>
        <svg width="340" height="80" viewBox="0 0 340 80" fill="none">
          <rect x="0" y="20" width="340" height="40" rx="20" fill="#E3F2FD"/>
          <rect x="120" y="40" width="100" height="20" rx="10" fill="#1976D2"/>
          <circle cx="170" cy="50" r="10" fill="#FFD600"/>
          <rect x="160" y="30" width="20" height="10" rx="5" fill="#fff"/>
        </svg>
      </Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#111', letterSpacing: '-0.03em', fontFamily: 'Uber Move, Inter, Arial, sans-serif', textAlign: 'center' }}>
        Welcome back, {dashboard.profile.first_name}!
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#555', mb: 4, fontWeight: 500, textAlign: 'center' }}>
        Here's your driving summary and quick actions
      </Typography>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ fontSize: 40, mr: 2, color: '#000' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 700, color: '#222' }}>
                  Total Rides
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{dashboard.stats.totalRides}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, mr: 2, color: '#43a047' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 700, color: '#222' }}>
                  Today's Earnings
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>${dashboard.earnings.today?.totalEarnings?.toFixed(2) || '0.00'}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 700, color: '#222' }}>
                  Completed Rides
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{dashboard.stats.completedRides}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StarIcon sx={{ fontSize: 40, mr: 2, color: '#FFD600' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 700, color: '#222' }}>
                  Your Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 1, fontWeight: 900 }}>
                    {dashboard.stats.rating.toFixed(1)}
                  </Typography>
                  <Rating value={dashboard.stats.rating} readOnly precision={0.5} size="small" />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        {/* Map Area */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#111' }}>
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
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.100' }}>
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
          </Paper>
        </Grid>
        {/* Earnings Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#111' }}>
              Earnings Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem divider>
                <ListItemText primary="Today" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>${dashboard.earnings.today?.totalEarnings?.toFixed(2) || '0.00'}</Typography>
              </ListItem>
              <ListItem divider>
                <ListItemText primary="This Week" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>${dashboard.earnings.week?.totalEarnings?.toFixed(2) || '0.00'}</Typography>
              </ListItem>
              <ListItem divider>
                <ListItemText primary="This Month" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>${dashboard.earnings.month?.totalEarnings?.toFixed(2) || '0.00'}</Typography>
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Earnings" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>${dashboard.earnings.total?.toFixed(2) || '0.00'}</Typography>
              </ListItem>
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button component={Link} to="/driver/earnings" variant="outlined" sx={{ borderRadius: 999, fontWeight: 700, px: 3, py: 1 }}>
                View Detailed Earnings
              </Button>
            </Box>
          </Paper>
        </Grid>
        {/* Recent Rides */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', bgcolor: '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#111' }}>
              Recent Rides
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentRides.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
                  <rect x="10" y="30" width="100" height="20" rx="10" fill="#E3F2FD"/>
                  <rect x="40" y="40" width="40" height="10" rx="5" fill="#1976D2"/>
                  <circle cx="60" cy="45" r="6" fill="#FFD600"/>
                </svg>
                <Typography sx={{ mt: 2 }}>No rides yet. Go online to start accepting rides!</Typography>
              </Box>
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
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>${ride.fare_amount?.toFixed(2) || '0.00'}</Typography>
                      <Button component={Link} to={`/driver/history/${ride.ride_id}`} size="small" sx={{ mt: 1, borderRadius: 999, fontWeight: 700, px: 2, py: 0.5 }}>
                        View Details
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button component={Link} to="/driver/history" variant="contained" sx={{ borderRadius: 999, fontWeight: 700, px: 3, py: 1, background: '#000', color: '#fff', '&:hover': { background: '#222' } }}>
                View All Rides
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export default DriverDashboard;