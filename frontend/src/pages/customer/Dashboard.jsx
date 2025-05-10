// src/pages/customer/Dashboard.jsx
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
  Rating
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Star as StarIcon,
  Check as CheckIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { customerService } from '../../services/customerService';

function CustomerDashboard() {
  const { user } = useSelector(state => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Since we don't have a specific dashboard endpoint, let's get ride history
        const ridesResponse = await customerService.getRideHistory(user.customer_id);
        const profileResponse = await customerService.getProfile(user.customer_id);
        
        // Transform the location data in each ride
        const transformedRides = ridesResponse.data.map(ride => ({
          ...ride,
          pickup_location: ride.pickup_location && {
            latitude: ride.pickup_location.coordinates ? ride.pickup_location.coordinates[1] : 0,
            longitude: ride.pickup_location.coordinates ? ride.pickup_location.coordinates[0] : 0
          },
          dropoff_location: ride.dropoff_location && {
            latitude: ride.dropoff_location.coordinates ? ride.dropoff_location.coordinates[1] : 0,
            longitude: ride.dropoff_location.coordinates ? ride.dropoff_location.coordinates[0] : 0
          }
        }));
        
        // Combine data to create a dashboard view
        setDashboard({
          profile: profileResponse.data,
          rides: transformedRides,
          stats: {
            totalRides: transformedRides.length,
            completedRides: transformedRides.filter(ride => ride.status === 'completed').length,
            cancelledRides: transformedRides.filter(ride => ride.status === 'cancelled').length,
            rating: profileResponse.data.rating || 0
          }
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };
    
    if (user?.customer_id) {
      fetchDashboard();
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#111', letterSpacing: '-0.03em', fontFamily: 'Uber Move, Inter, Arial, sans-serif' }}>
        Welcome back, {dashboard.profile.first_name}!
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#555', mb: 4, fontWeight: 500, textAlign: 'center' }}>
        Here's a summary of your ride activity and quick actions
      </Typography>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3, p: 1, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon sx={{ fontSize: 40, mr: 2, color: '#111' }} />
                <Box>
                  <Typography color="#888" gutterBottom sx={{ fontWeight: 700 }}>
                    Total Rides
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{dashboard.stats.totalRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {dashboard.rides.find(ride => 
  ['requested', 'accepted', 'in_progress'].includes(ride.status)
) && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Active Ride</Typography>
          <Typography variant="body1">
            You have an ongoing ride. Check its status or manage it.
          </Typography>
        </Box>
        <Button 
          component={Link} 
          to={`/customer/ride/${dashboard.rides.find(ride => 
            ['requested', 'accepted', 'in_progress'].includes(ride.status)
          ).ride_id}`}
          variant="contained" 
          color="inherit"
        >
          View Active Ride
        </Button>
      </Box>
    </Paper>
  </Grid>
)}
        
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ fontSize: 40, mr: 2, color: '#27ae60' }} />
                <Box>
                  <Typography color="#888" gutterBottom sx={{ fontWeight: 600 }}>
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{dashboard.stats.completedRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ fontSize: 40, mr: 2, color: '#ff9900' }} />
                <Box>
                  <Typography color="#888" gutterBottom sx={{ fontWeight: 600 }}>
                    Cancelled
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{dashboard.stats.cancelledRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ fontSize: 40, mr: 2, color: '#111' }} />
                <Box>
                  <Typography color="#888" gutterBottom sx={{ fontWeight: 600 }}>
                    Your Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ mr: 1, fontWeight: 800 }}>
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
        
        {/* Recent Rides */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3, p: 1, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#111' }}>
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
                  <Typography sx={{ mt: 2 }}>No rides yet. Book your first ride now!</Typography>
                </Box>
              ) : (
                <List>
                  {recentRides.map((ride) => (
                    <ListItem key={ride.ride_id} divider>
                      {/* Car SVG for each ride */}
                      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <rect x="6" y="14" width="20" height="8" rx="4" fill="#222"/>
                          <rect x="10" y="16" width="5" height="4" rx="2" fill="#fff"/>
                          <rect x="17" y="16" width="5" height="4" rx="2" fill="#fff"/>
                          <circle cx="11" cy="24" r="2" fill="#FFD600"/>
                          <circle cx="21" cy="24" r="2" fill="#FFD600"/>
                        </svg>
                      </Box>
                      <ListItemText
                        primary={<span style={{ fontWeight: 700 }}>{`Ride #${ride.ride_id}`}</span>}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {new Date(ride.date_time).toLocaleString()}
                            </Typography>
                            <br />
                            {`${ride.pickup_location.latitude.toFixed(6)}, ${ride.pickup_location.longitude.toFixed(6)} → 
                              ${ride.dropoff_location.latitude.toFixed(6)}, ${ride.dropoff_location.longitude.toFixed(6)}`}
                            <br />
                            {`Status: ${ride.status}`}
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>${ride.fare_amount.toFixed(2)}</Typography>
                        <Button 
                          component={Link} 
                          to={`/customer/ride/${ride.ride_id}`}
                          size="small"
                          className="uber-btn"
                          sx={{ mt: 1, fontWeight: 700, fontSize: '1em', px: 3, background: '#000', color: '#fff', borderRadius: 999, boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
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
                  to="/customer/history"
                  className="uber-btn"
                  sx={{ fontWeight: 700, fontSize: '1em', px: 4, background: '#000', color: '#fff', borderRadius: 999, boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
                >
                  View All Rides
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 3, p: 1, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#111' }}>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button 
                component={Link} 
                to="/customer/book"
                className="uber-btn"
                fullWidth
                startIcon={<CarIcon />}
                sx={{ fontWeight: 700, fontSize: '1.1em', px: 0, py: 1.2, background: '#000', color: '#fff', borderRadius: 999, boxShadow: 'none', border: 'none', mb: 2, '&:hover': { background: '#222', color: '#fff' } }}
              >
                Book a Ride
              </Button>
              <Button 
                component={Link} 
                to="/customer/profile"
                className="uber-btn uber-btn-secondary"
                fullWidth
                sx={{ fontWeight: 700, fontSize: '1.1em', px: 0, py: 1.2, background: '#fff', color: '#000', borderRadius: 999, border: '2px solid #000', boxShadow: 'none', '&:hover': { background: '#f6f6f6', color: '#000', borderColor: '#000' } }}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CustomerDashboard;