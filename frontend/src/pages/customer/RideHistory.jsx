// src/pages/customer/RideHistory.jsx
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
import { customerService } from '../../services/customerService';

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
        console.log('Fetching ride history for customer:', user.customer_id);
        const response = await customerService.getRideHistory(user.customer_id);
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ride history:', err);
        setError(err.response?.data?.message || 'Failed to load ride history');
        setLoading(false);
      }
    };
    
    if (user?.customer_id) {
      fetchRideHistory();
    } else {
      console.warn('No customer_id found in user object:', user);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ride History
      </Typography>
      
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
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ride) => (
                    <TableRow key={ride.ride_id || `ride-${Math.random()}`}>
                      <TableCell>{ride.ride_id || 'N/A'}</TableCell>
                      <TableCell>{ride.date_time ? new Date(ride.date_time).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        {ride.pickup_location && ride.pickup_location.coordinates ? 
                          `${ride.pickup_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.pickup_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                          (ride.pickup_location && ride.pickup_location.latitude ? 
                            `${ride.pickup_location.latitude.toFixed(4)}, ${ride.pickup_location.longitude.toFixed(4)}` : 
                            'N/A')}
                      </TableCell>
                      <TableCell>
                        {ride.dropoff_location && ride.dropoff_location.coordinates ? 
                          `${ride.dropoff_location.coordinates[1]?.toFixed(4) || '0.0000'}, ${ride.dropoff_location.coordinates[0]?.toFixed(4) || '0.0000'}` : 
                          (ride.dropoff_location && ride.dropoff_location.latitude ? 
                            `${ride.dropoff_location.latitude.toFixed(4)}, ${ride.dropoff_location.longitude.toFixed(4)}` : 
                            'N/A')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={(ride.status || 'unknown').charAt(0).toUpperCase() + (ride.status || 'unknown').slice(1)}
                          color={getStatusColor(ride.status || 'unknown')}
                          size="small"
                        />
                        {ride.status === 'cancelled' && ride.cancellation_time && (
                          <Typography variant="caption" display="block" color="error">
                            {new Date(ride.cancellation_time).toLocaleString()}
                            {ride.cancellation_reason && ` (${ride.cancellation_reason.replace('_', ' ')})`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>${(ride.fare_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          component={Link}
                          to={`/customer/ride/${ride.ride_id}`}
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