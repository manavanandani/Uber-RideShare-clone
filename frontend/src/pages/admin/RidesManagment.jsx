// src/pages/admin/RidesManagement.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function RidesManagement() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  
  // Search parameters
  const [customerIdSearch, setCustomerIdSearch] = useState('');
  const [driverIdSearch, setDriverIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (customerIdSearch) queryParams.append('customerId', customerIdSearch);
      if (driverIdSearch) queryParams.append('driverId', driverIdSearch);
      if (dateFilter) queryParams.append('startDate', dateFilter);
      
      // Use the proper endpoint
      const response = await api.get(`/rides/admin/all?${queryParams.toString()}`);
      
      setRides(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rides');
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (field, value) => {
    switch (field) {
      case 'customer':
        setCustomerIdSearch(value);
        break;
      case 'driver':
        setDriverIdSearch(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'date':
        setDateFilter(value);
        break;
      default:
        break;
    }
    setPage(0);
  };

  const handleDeleteClick = (ride) => {
    setCurrentRide(ride);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/rides/${currentRide.ride_id}`);
      setOpenDeleteDialog(false);
      // Remove deleted ride from the list
      setRides(prev => prev.filter(ride => ride.ride_id !== currentRide.ride_id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ride');
    }
  };

  const handleShowMap = (ride) => {
    setCurrentRide(ride);
    setOpenMapDialog(true);
  };

  // Filter rides based on search parameters
  const filteredRides = rides.filter(ride => {
    const matchesCustomer = customerIdSearch === '' || 
      (ride.customer_id && ride.customer_id.includes(customerIdSearch));
    
    const matchesDriver = driverIdSearch === '' || 
      (ride.driver_id && ride.driver_id.includes(driverIdSearch));
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    const matchesDate = dateFilter === '' || 
      (ride.date_time && new Date(ride.date_time).toDateString() === new Date(dateFilter).toDateString());
    
    return matchesCustomer && matchesDriver && matchesStatus && matchesDate;
  });

  // Get color for status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'accepted': return 'info';
      case 'requested': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Rides Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Rides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Customer ID"
              value={customerIdSearch}
              onChange={(e) => handleSearchChange('customer', e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Driver ID"
              value={driverIdSearch}
              onChange={(e) => handleSearchChange('driver', e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => handleSearchChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="requested">Requested</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e) => handleSearchChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride ID</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Fare</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No rides found matching the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRides
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ride) => (
                    <TableRow key={ride.ride_id}>
                      <TableCell>{ride.ride_id}</TableCell>
                      <TableCell>{new Date(ride.date_time).toLocaleString()}</TableCell>
                      <TableCell>{ride.customer_id}</TableCell>
                      <TableCell>{ride.driver_id}</TableCell>
                      <TableCell>${ride.fare_amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={ride.status || 'Unknown'} 
                          color={getStatusColor(ride.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          component={Link}
                          to={`/admin/rides/${ride.ride_id}`}
                          size="small"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="info"
                          onClick={() => handleShowMap(ride)}
                          size="small"
                        >
                          <LocationIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(ride)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRides.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete ride #{currentRide?.ride_id}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Map Dialog */}
      <Dialog
        open={openMapDialog}
        onClose={() => setOpenMapDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ride Route</DialogTitle>
        <DialogContent>
          {currentRide && (
            <Box sx={{ height: 400 }}>
              <MapWithMarkers
                pickup={{
                  lat: currentRide.pickup_location?.latitude,
                  lng: currentRide.pickup_location?.longitude
                }}
                dropoff={{
                  lat: currentRide.dropoff_location?.latitude,
                  lng: currentRide.dropoff_location?.longitude
                }}
                showDirections={true}
                height={400}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMapDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RidesManagement;