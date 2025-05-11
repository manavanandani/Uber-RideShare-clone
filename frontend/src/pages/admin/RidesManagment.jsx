// src/pages/admin/RidesManagement.jsx
import { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../../services/api';

function RidesManagement() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRides();
  }, [page, rowsPerPage]);

  const fetchRides = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Combine pagination with any filters
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      if (filters.searchQuery) {
        queryParams.append('search', filters.searchQuery);
      }
      
      const endpoint = `/rides/admin/all?${queryParams.toString()}`;
      const response = await api.get(endpoint);
      
      if (response.data && Array.isArray(response.data.data)) {
        setRides(response.data.data);
        setTotalCount(response.data.pagination?.total || response.data.data.length);
      } else {
        setRides([]);
        setTotalCount(0);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError(err.response?.data?.message || 'Failed to load rides');
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchRides(filter);
  };

  const resetFilters = () => {
    setFilter({
      status: 'all',
      startDate: '',
      endDate: '',
      searchQuery: ''
    });
    fetchRides();
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Rides Management</Typography>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                name="searchQuery"
                value={filter.searchQuery}
                onChange={handleFilterChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filter.status}
                  label="Status"
                  onChange={handleFilterChange}
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
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={filter.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={filter.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="contained" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride ID</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fare</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride) => (
                  <TableRow key={ride.ride_id}>
                    <TableCell>{ride.ride_id}</TableCell>
                    <TableCell>{new Date(ride.date_time).toLocaleString()}</TableCell>
                    <TableCell>{ride.customer_id}</TableCell>
                    <TableCell>{ride.driver_id || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ride.status} 
                        color={getStatusColor(ride.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${(ride.fare_amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary"
                        component={Link}
                        to={`/admin/rides/${ride.ride_id}`}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default RidesManagement;