// src/pages/admin/Analytics.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Analytics() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [ridesByAreaData, setRidesByAreaData] = useState([]);
  const [ridesByDriverData, setRidesByDriverData] = useState([]);
  const [ridesByCustomerData, setRidesByCustomerData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [dateRange, setDateRange] = useState('month');

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get revenue statistics
      const startDate = getStartDateFromRange(dateRange);
      const revenueResponse = await api.get(`/stats/revenue?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`);
      
      // Get rides by area
      const areaResponse = await api.get('/stats/rides-by-area');
      
      // Get rides by driver
      const driverResponse = await api.get('/stats/graph-data?type=drivers');
      
      // Get rides by customer
      const customerResponse = await api.get('/stats/graph-data?type=customers');
      
      // Get performance comparison data
      const performanceResponse = await api.get('/stats/performance-comparison');
      
      setRevenueData(revenueResponse.data.data || []);
      setRidesByAreaData(areaResponse.data.data || []);
      setRidesByDriverData(driverResponse.data.data || []);
      setRidesByCustomerData(customerResponse.data.data || []);
      setPerformanceData(performanceResponse.data.data || { configurations: [], metrics: [] });
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  // Helper to get the start date based on selected range
  const getStartDateFromRange = (range) => {
    const today = new Date();
    switch (range) {
      case 'week':
        return new Date(today.setDate(today.getDate() - 7));
      case 'month':
        return new Date(today.setMonth(today.getMonth() - 1));
      case 'quarter':
        return new Date(today.setMonth(today.getMonth() - 3));
      case 'year':
        return new Date(today.setFullYear(today.getFullYear() - 1));
      default:
        return new Date(today.setDate(today.getDate() - 30));
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
        Analytics Dashboard
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            label="Date Range"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Tabs value={value} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Revenue" />
        <Tab label="Ride Distribution" />
        <Tab label="Performance" />
        <Tab label="Users" />
      </Tabs>
      
      <TabPanel value={value} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={revenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => ['$' + value.toFixed(2), 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalRevenue" 
                    stroke="#8884d8" 
                    name="Revenue" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ride Count by Day
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
              <BarChart
                  data={revenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Rides']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="rideCount" fill="#82ca9d" name="Ride Count" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Average Revenue per Ride
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenueData.map(item => ({
                    ...item,
                    avgRevenue: item.rideCount > 0 ? item.totalRevenue / item.rideCount : 0
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => ['$' + value.toFixed(2), 'Avg Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="avgRevenue" fill="#8884d8" name="Avg Revenue per Ride" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={value} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rides by Area
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={ridesByAreaData.slice(0, 10)} // Top 10 areas
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="_id" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rideCount" fill="#8884d8" name="Ride Count" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Area
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={ridesByAreaData.slice(0, 8)} // Top 8 areas
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                    nameKey="_id"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {ridesByAreaData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => '$' + value.toFixed(2)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={value} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                System Performance Comparison
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Comparison of different system configurations for 100 concurrent users
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={performanceData.configurations}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="requestsPerSecond" fill="#8884d8" name="Requests/Second" />
                  <Bar yAxisId="right" dataKey="responseTimeMs" fill="#82ca9d" name="Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Response Time by Operation (ms)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={performanceData.metrics}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="base" fill="#8884d8" name="Base" />
                  <Bar dataKey="withCache" fill="#82ca9d" name="With Cache" />
                  <Bar dataKey="withKafka" fill="#ffc658" name="With Cache + Kafka" />
                  <Bar dataKey="withDistributed" fill="#ff8042" name="Full Distributed" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={value} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Drivers by Rides
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={ridesByDriverData.slice(0, 10)} // Top 10 drivers
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="driver_name" 
                    width={150} 
                    tickFormatter={(value) => value || `Driver ${value?._id}`}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRides" fill="#8884d8" name="Total Rides" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Customers by Rides
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={ridesByCustomerData.slice(0, 10)} // Top 10 customers
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="customer_name" 
                    width={150} 
                    tickFormatter={(value) => value || `Customer ${value?._id}`}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRides" fill="#82ca9d" name="Total Rides" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Drivers by Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={ridesByDriverData.slice(0, 8)} // Top 8 drivers
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                    nameKey="driver_name"
                    label={({ name, percent }) => `${name || 'Driver'}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {ridesByDriverData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => '$' + value.toFixed(2)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Customers by Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={ridesByCustomerData.slice(0, 8)} // Top 8 customers
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#82ca9d"
                    dataKey="totalRevenue"
                    nameKey="customer_name"
                    label={({ name, percent }) => `${name || 'Customer'}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {ridesByCustomerData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => '$' + value.toFixed(2)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default Analytics;