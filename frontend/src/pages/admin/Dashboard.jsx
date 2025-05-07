// frontend/src/pages/admin/Dashboard.jsx
// Modify the component to remove System Health section

import { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        setLoading(true);
        // Removed getHealth API call
        const statsResponse = await api.get('/admin/stats/summary');
        
        setStats({
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

        {/* System Health Section Removed */}
        
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