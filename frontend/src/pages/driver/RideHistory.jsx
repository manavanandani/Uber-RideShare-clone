// src/pages/driver/RideHistory.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { driverService } from '../../services/driverService';

function RideHistory() {
  const { user } = useSelector(state => state.auth);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        setLoading(true);
        console.log('Fetching ride history for driver:', user.driver_id);
        const response = await driverService.getRideHistory(user.driver_id);
        console.log('Ride history response:', response);
        
        let rideData = [];
        
        // Handle different response formats
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            rideData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            rideData = response.data.data;
          }
        }
        
        console.log('Processed ride data:', rideData);
        setRides(rideData);
        setFilteredRides(rideData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ride history:', err);
        setError(err.response?.data?.message || 'Failed to load ride history');
        setLoading(false);
      }
    };
    
    if (user?.driver_id) {
      fetchRideHistory();
    }
  }, [user]);

  useEffect(() => {
    // Apply filters
    let result = [...rides];
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(ride => ride.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(ride => {
        const rideDate = new Date(ride.date_time);
        return (
          rideDate.getFullYear() === filterDate.getFullYear() &&
          rideDate.getMonth() === filterDate.getMonth() &&
          rideDate.getDate() === filterDate.getDate()
        );
      });
    }
    
    setFilteredRides(result);
    setPage(0); // Reset to first page when filters change
  }, [statusFilter, dateFilter, rides]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
  };

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

  // Calculate total earnings
  const totalEarnings = filteredRides.reduce((sum, ride) => {
    return ride.status === 'completed' ? sum + (ride.fare_amount || 0) : sum;
  }, 0);

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
        Ride History
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Total Rides</Typography>
                <Typography variant="h5">{rides.length}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Completed Rides</Typography>
                <Typography variant="h5">
                  {rides.filter(ride => ride.status === 'completed').length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Total Earnings</Typography>
                <Typography variant="h5" color="primary">
                  ${totalEarnings.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Filters</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="date-filter"
                  label="Date"
                  type="date"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button onClick={clearFilters} variant="outlined">
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ride ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Fare</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No rides found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRides
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((ride) => (
                        <TableRow key={ride.ride_id}>
                          <TableCell>{ride.ride_id}</TableCell>
                          <TableCell>{new Date(ride.date_time).toLocaleString()}</TableCell>
                          <TableCell>
                            {ride.pickup_location && ride.pickup_location.coordinates ? 
                              `${ride.pickup_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.pickup_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            {ride.dropoff_location && ride.dropoff_location.coordinates ? 
                              `${ride.dropoff_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.dropoff_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={(ride.status || 'unknown').charAt(0).toUpperCase() + (ride.status || 'unknown').slice(1)}
                              color={getStatusColor(ride.status || 'unknown')}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>${(ride.fare_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              component={Link}
                              to={`/driver/history/${ride.ride_id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRides.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export default RideHistory;