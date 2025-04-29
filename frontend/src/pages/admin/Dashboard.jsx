// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function AdminDashboard() {
  const { user } = useSelector(state => state.auth);
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get system stats
        const statsResponse = await api.get('/admin/stats/summary');
        
        // Get revenue statistics
        const revenueResponse = await api.get(`/stats/revenue?period=${period}`);
        
        // Get ride statistics by area
        const areaResponse = await api.get('/stats/rides-by-area');
        
        // Get ride statistics by driver
        const driverResponse = await api.get('/stats/graph-data?type=drivers');
        
        // Get ride statistics by customer
        const customerResponse = await api.get('/stats/graph-data?type=customers');
        
        // Get performance comparison data
        const performanceResponse = await api.get('/stats/performance-comparison');
        
        setData({
          stats: statsResponse.data.data,
          revenue: revenueResponse.data.data,
          areas: areaResponse.data.data,
          drivers: driverResponse.data.data,
          customers: customerResponse.data.data,
          performance: performanceResponse.data.data
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [period]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
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
  
  if (!data) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Admin Dashboard
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="period-label">Period</InputLabel>
          <Select
            labelId="period-label"
            id="period-select"
            value={period}
            label="Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Drivers
              </Typography>
              <Typography variant="h4">
                {data.stats.counts.drivers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h4">
                {data.stats.counts.customers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Rides
              </Typography>
              <Typography variant="h4">
                {data.stats.counts.rides}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                ${data.stats.revenue.total.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Revenue Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Revenue Trend
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.revenue}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue" />
              <Line type="monotone" dataKey="rideCount" stroke="#82ca9d" name="Rides" yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      {/* Ride Status Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ride Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(data.stats.rideStatusDistribution).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(data.stats.rideStatusDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Rides']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Rides by Area (Top 5)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.areas.slice(0, 5)}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rideCount" name="Rides" fill="#8884d8" />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Top Drivers & Customers */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Drivers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.drivers.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="driver_name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRides" name="Rides" fill="#8884d8" />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Customers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.customers.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="customer_name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRides" name="Rides" fill="#8884d8" />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Performance Comparison */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Performance Comparison
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.performance.configurations}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="requestsPerSecond" name="Requests/sec" fill="#8884d8" />
              <Bar dataKey="responseTimeMs" name="Response Time (ms)" fill="#82ca9d" />
              <Bar dataKey="throughput" name="Throughput" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          This chart compares system performance across different configurations:
        </Typography>
        <ul>
          {data.performance.configurations.map((config, index) => (
            <li key={index}>
              <Typography variant="body2" color="textSecondary">
                <strong>{config.name}:</strong> {config.description}
              </Typography>
            </li>
          ))}
        </ul>
      </Paper>
    </Box>
  );
}

export default AdminDashboard;