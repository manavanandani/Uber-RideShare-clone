// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
//import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Receipt as BillingIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import api from '../../services/api';

function AdminDashboard() {
  //const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stats/health');
        const statsResponse = await api.get('/admin/stats/summary');
        
        setStats({
          health: response.data.data,
          counts: statsResponse.data.data.counts,
          revenue: statsResponse.data.data.revenue,
          rideStatusDistribution: statsResponse.data.data.rideStatusDistribution
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load system statistics');
        setLoading(false);
      }
    };
    
    fetchSystemStats();
  }, []);

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
        System Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Customers
                  </Typography>
                  <Typography variant="h4">{stats?.counts?.customers || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Drivers
                  </Typography>
                  <Typography variant="h4">{stats?.counts?.drivers || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Rides
                  </Typography>
                  <Typography variant="h4">{stats?.counts?.rides || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BillingIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Revenue
                  </Typography>
                  <Typography variant="h4">${stats?.revenue?.total?.toFixed(2) || '0.00'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Database</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Status:</Typography>
                      <Typography 
                        variant="body2" 
                        color={stats?.health?.services?.database?.status === 'healthy' ? 'success.main' : 'error.main'}
                      >
                        {stats?.health?.services?.database?.status || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Time:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.database?.responseTime || 0} ms</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Connections:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.database?.connections || 0}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Redis Cache</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Status:</Typography>
                      <Typography 
                        variant="body2" 
                        color={stats?.health?.services?.redis?.status === 'healthy' ? 'success.main' : 'error.main'}
                      >
                        {stats?.health?.services?.redis?.status || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Time:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.redis?.responseTime || 0} ms</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Memory Used:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.redis?.usedMemory || '0MB'}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Kafka</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Status:</Typography>
                      <Typography 
                        variant="body2" 
                        color={stats?.health?.services?.kafka?.status === 'healthy' ? 'success.main' : 'error.main'}
                      >
                        {stats?.health?.services?.kafka?.status || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Message Rate:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.kafka?.messageRate || 0}/min</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Consumer Lag:</Typography>
                      <Typography variant="body2">{stats?.health?.services?.kafka?.consumerLag || 0}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Button 
                  component={Link} 
                  to="/admin/drivers/add" 
                  variant="contained" 
                  fullWidth
                  startIcon={<CarIcon />}
                >
                  Add Driver
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  component={Link} 
                  to="/admin/customers/add" 
                  variant="contained" 
                  fullWidth
                  startIcon={<PeopleIcon />}
                >
                  Add Customer
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  component={Link} 
                  to="/admin/billing/search" 
                  variant="contained" 
                  fullWidth
                  startIcon={<BillingIcon />}
                >
                  Search Bills
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  component={Link} 
                  to="/admin/analytics" 
                  variant="contained" 
                  fullWidth
                  startIcon={<TrendingIcon />}
                >
                  View Analytics
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;