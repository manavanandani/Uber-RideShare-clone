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
  Alert
} from '@mui/material';
import api from '../../services/api';

function RideHistory() {
  const { user } = useSelector(state => state.auth);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rides/driver/${user.driver_id}`);
        setRides(response.data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ride history');
        setLoading(false);
      }
    };
    
    if (user?.driver_id) {
      fetchRideHistory();
    }
  }, [user]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Calculate total earnings
  const totalEarnings = rides
    .filter(ride => ride.status === 'completed')
    .reduce((sum, ride) => sum + ride.fare_amount, 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ride History
      </Typography>
      
      {/* Earnings Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Rides
            </Typography>
            <Typography variant="h4">
              {rides.length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Completed Rides
            </Typography>
            <Typography variant="h4">
              {rides.filter(ride => ride.status === 'completed').length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Earnings
            </Typography>
            <Typography variant="h4">
              ${totalEarnings.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Ride History Table */}
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
                <TableCell>Customer</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ride) => (
                    <TableRow key={ride.ride_id}>
                      <TableCell>{ride.ride_id}</TableCell>
                      <TableCell>{new Date(ride.date_time).toLocaleString()}</TableCell>
                      <TableCell>
                        {`${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}`}
                      </TableCell>
                      <TableCell>
                        {`${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}`}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                          color={getStatusColor(ride.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${ride.fare_amount.toFixed(2)}</TableCell>
                      <TableCell>{ride.customer_id}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          component={Link}
                          to={`/driver/ride/${ride.ride_id}`}
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
          count={rides.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

export default RideHistory;