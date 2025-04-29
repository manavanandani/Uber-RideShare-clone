// src/pages/customer/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { customerService } from '../../services/customerService';
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
import { Link } from 'react-router-dom';

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
        
        // Combine data to create a dashboard view
        setDashboard({
          profile: profileResponse.data,
          rides: ridesResponse.data,
          stats: {
            totalRides: ridesResponse.data.length,
            completedRides: ridesResponse.data.filter(ride => ride.status === 'completed').length,
            cancelledRides: ridesResponse.data.filter(ride => ride.status === 'cancelled').length,
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {dashboard.profile.first_name}!
      </Typography>
      
      <Grid container spacing={3}>
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
                <CheckIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed
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
                <HistoryIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cancelled
                  </Typography>
                  <Typography variant="h4">{dashboard.stats.cancelledRides}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
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
        
        {/* Recent Rides */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Rides
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentRides.length === 0 ? (
                <Typography>No rides yet. Book your first ride now!</Typography>
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
                          to={`/customer/ride/${ride.ride_id}`}
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
                  to="/customer/history"
                  variant="outlined"
                >
                  View All Rides
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  component={Link} 
                  to="/customer/book" 
                  variant="contained" 
                  size="large"
                  startIcon={<CarIcon />}
                  fullWidth
                >
                  Book a Ride
                </Button>
                
                <Button 
                  component={Link} 
                  to="/customer/profile" 
                  variant="outlined"
                  size="large"
                  fullWidth
                >
                  Update Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CustomerDashboard;