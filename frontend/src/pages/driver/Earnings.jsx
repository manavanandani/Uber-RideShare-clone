// src/pages/driver/Earnings.jsx (further corrected version)
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';

// Simple TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`earnings-tabpanel-${index}`}
      aria-labelledby={`earnings-tab-${index}`}
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

function Earnings() {
  const { user } = useSelector(state => state.auth);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

// In src/pages/driver/Earnings.jsx - update the useEffect hook
useEffect(() => {
  const fetchEarnings = async () => {
    try {
      setLoading(true);
      console.log('Fetching earnings for driver:', user.driver_id);
      const response = await driverService.getEarnings(user.driver_id);
      console.log('Earnings response:', response);
      
      // Process the earnings data
      let earningsData = {};
      
      // Handle different response formats
      if (response && response.data) {
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          earningsData = response.data;
        } else if (Array.isArray(response.data)) {
          // Handle array response by organizing it into periods
          const billings = response.data;
          earningsData = {
            today: { totalEarnings: 0, totalRides: 0, rides: [] },
            week: { totalEarnings: 0, totalRides: 0, rides: [] },
            month: { totalEarnings: 0, totalRides: 0, rides: [] },
            year: { totalEarnings: 0, totalRides: 0, rides: [] },
            all: { totalEarnings: 0, totalRides: 0, rides: [...billings] }
          };
          
          // Calculate totals
          if (billings.length > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const yearStart = new Date(now.getFullYear(), 0, 1);
            
            // Calculate total earnings
            earningsData.all.totalEarnings = billings.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
            earningsData.all.totalRides = billings.length;
            
            // Filter for each period
            billings.forEach(bill => {
              const billDate = new Date(bill.date);
              const amount = bill.total_amount || 0;
              
              // Today
              if (billDate >= today) {
                earningsData.today.rides.push(bill);
                earningsData.today.totalEarnings += amount;
                earningsData.today.totalRides++;
              }
              
              // This week
              if (billDate >= weekStart) {
                earningsData.week.rides.push(bill);
                earningsData.week.totalEarnings += amount;
                earningsData.week.totalRides++;
              }
              
              // This month
              if (billDate >= monthStart) {
                earningsData.month.rides.push(bill);
                earningsData.month.totalEarnings += amount;
                earningsData.month.totalRides++;
              }
              
              // This year
              if (billDate >= yearStart) {
                earningsData.year.rides.push(bill);
                earningsData.year.totalEarnings += amount;
                earningsData.year.totalRides++;
              }
            });
          }
        }
      }
      
      console.log('Processed earnings data:', earningsData);
      
      // Ensure all periods have data
      const processed = {
        today: earningsData.today || {
          totalEarnings: 0,
          totalRides: 0,
          rides: []
        },
        week: earningsData.week || {
          totalEarnings: 0,
          totalRides: 0,
          rides: []
        },
        month: earningsData.month || {
          totalEarnings: 0,
          totalRides: 0,
          rides: []
        },
        year: earningsData.year || {
          totalEarnings: 0,
          totalRides: 0,
          rides: []
        },
        all: earningsData.all || {
          totalEarnings: 0,
          totalRides: 0,
          rides: []
        }
      };
      
      setEarnings(processed);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError(err.response?.data?.message || 'Failed to load earnings data');
      setLoading(false);
    }
  };
  
  if (user?.driver_id) {
    fetchEarnings();
  }
}, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Removing the unused getCurrentPeriodData function and periodData variable

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

  if (!earnings) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Earnings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Earnings
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" color="success.main">
                  ${earnings.all.totalEarnings?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Rides
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" color="primary.main">
                  {earnings.all.totalRides || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Period Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Today" />
              <Tab label="This Week" />
              <Tab label="This Month" />
              <Tab label="This Year" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <EarningsPeriodContent data={earnings.today} periodLabel="Today" />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <EarningsPeriodContent data={earnings.week} periodLabel="This Week" />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <EarningsPeriodContent data={earnings.month} periodLabel="This Month" />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <EarningsPeriodContent data={earnings.year} periodLabel="This Year" />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Component for individual period content
// Component for individual period content
function EarningsPeriodContent({ data, periodLabel }) {
  if (!data) {
    return <Typography>No data available for this period.</Typography>;
  }
  
  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="textSecondary">
            Earnings for {periodLabel}
          </Typography>
          <Typography variant="h4" color="success.main">
            ${data.totalEarnings?.toFixed(2) || '0.00'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="textSecondary">
            Total Rides
          </Typography>
          <Typography variant="h4">
            {data.totalRides || 0}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="textSecondary">
            Average Per Ride
          </Typography>
          <Typography variant="h4">
            ${data.totalRides ? (data.totalEarnings / data.totalRides).toFixed(2) : '0.00'}
          </Typography>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        Ride Details
      </Typography>
      
      {data.rides && data.rides.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill ID</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>From / To</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rides.map((billing) => {
                // Format date properly
                const dateStr = billing.date || billing.pickup_time || '';
                const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : 'N/A';
                
                // Get source and destination locations
                const sourceLocation = billing.source_location || 'N/A';
                const destLocation = billing.destination_location || 'N/A';
                const locationText = `${sourceLocation} → ${destLocation}`;
                
                // Get the amount
                const amount = billing.total_amount || billing.fare_amount || 0;
                
                return (
                  <TableRow key={billing.bill_id || billing.ride_id || billing._id}>
                    <TableCell>{billing.bill_id || billing.ride_id || 'N/A'}</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{locationText}</TableCell>
                    <TableCell align="right">${amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {billing.payment_status || billing.status || 'completed'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No rides found for this period.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Earnings;