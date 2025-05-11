// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch system statistics
        const statsResponse = await api.get('/admin/stats/summary');
        if (statsResponse.data && statsResponse.data.data) {
          setStats(statsResponse.data.data);
        }
        
        // Fetch revenue data for the chart
        const revenueResponse = await api.get('/stats/revenue');
        if (revenueResponse.data && revenueResponse.data.data) {
          setRevenueData(revenueResponse.data.data);
        }
        
        // Fetch recent rides
        const ridesResponse = await api.get('/rides/admin/all?limit=5');
        if (ridesResponse.data && ridesResponse.data.data) {
          setRecentRides(ridesResponse.data.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats?.counts?.drivers || 0}
                  </Typography>
                  <Typography variant="body2">Drivers</Typography>
                </Box>
                <CarIcon sx={{ fontSize: 40 }} />
              </Box>
              <Button 
                component={RouterLink} 
                to="/admin/drivers"
                variant="contained" 
                color="primary" 
                size="small" 
                sx={{ mt: 2 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats?.counts?.customers || 0}
                  </Typography>
                  <Typography variant="body2">Customers</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40 }} />
              </Box>
              <Button 
                component={RouterLink} 
                to="/admin/customers"
                variant="contained" 
                color="secondary" 
                size="small" 
                sx={{ mt: 2 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats?.counts?.rides || 0}
                  </Typography>
                  <Typography variant="body2">Total Rides</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40 }} />
              </Box>
              <Button 
                component={RouterLink} 
                to="/admin/rides"
                variant="contained" 
                color="info" 
                size="small" 
                sx={{ mt: 2 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${stats?.revenue?.total?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Total Revenue</Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40 }} />
              </Box>
              <Button 
                component={RouterLink} 
                to="/admin/billing"
                variant="contained" 
                color="success" 
                size="small" 
                sx={{ mt: 2 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Revenue Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Day
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {revenueData && revenueData.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                    <Bar dataKey="rides" fill="#82ca9d" name="Number of Rides" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="textSecondary">No revenue data available</Typography>
              </Box>
            )}
          </Paper>
          
          {/* Recent Rides */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Rides
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentRides && recentRides.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ride ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Fare</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRides.map((ride) => (
                      <TableRow key={ride.ride_id}>
                        <TableCell>{ride.ride_id}</TableCell>
                        <TableCell>{new Date(ride.date_time).toLocaleString()}</TableCell>
                        <TableCell>{ride.customer_id}</TableCell>
                        <TableCell>{ride.driver_id || 'Not Assigned'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                            color={getStatusColor(ride.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">${ride.fare_amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Button 
                            component={RouterLink} 
                            to={`/admin/ride/${ride.ride_id}`}
                            size="small"
                            variant="outlined"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                <Typography color="textSecondary">No recent rides</Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                component={RouterLink} 
                to="/admin/rides"
                variant="contained"
              >
                View All Rides
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* System Statistics */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem divider>
                <ListItemText primary="Average Ride Fare" />
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ${stats?.revenue?.average?.toFixed(2) || '0.00'}
                </Typography>
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Minimum Fare" />
                <Typography variant="body1">
                  ${stats?.revenue?.minimum?.toFixed(2) || '0.00'}
                </Typography>
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Maximum Fare" />
                <Typography variant="body1">
                  ${stats?.revenue?.maximum?.toFixed(2) || '0.00'}
                </Typography>
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Total Billings" />
                <Typography variant="body1">
                  {stats?.counts?.billings || 0}
                </Typography>
              </ListItem>
            </List>
          </Paper>
          
          {/* Ride Status Distribution */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats?.rideStatusDistribution ? (
              <List>
                {Object.entries(stats.rideStatusDistribution).map(([status, count]) => (
                  <ListItem key={status} divider>
                    <ListItemText 
                      primary={
                        <Chip 
                          label={status.charAt(0).toUpperCase() + status.slice(1)}
                          color={getStatusColor(status)}
                          size="small"
                        />
                      } 
                    />
                    <Typography variant="body1">
                      {count}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                <Typography color="textSecondary">No status data available</Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                component={RouterLink} 
                to="/admin/analytics"
                variant="contained" 
                color="primary"
                endIcon={<AssessmentIcon />}
              >
                View Analytics
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;