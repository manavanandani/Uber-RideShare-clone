// src/pages/admin/BillingManagement.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import api from '../../services/api';

function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search filters
  const [filters, setFilters] = useState({
    customer_id: '',
    driver_id: '',
    min_amount: '',
    max_amount: '',
    start_date: null,
    end_date: null,
    payment_status: ''
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async (searchParams = {}) => {
    try {
      setLoading(true);
      
      // Construct query params
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'start_date' || key === 'end_date') {
            if (value instanceof Date && !isNaN(value)) {
              queryParams.append(key, value.toISOString());
            }
          } else {
            queryParams.append(key, value);
          }
        }
      });
      
      const response = await api.get(`/billing/search?${queryParams.toString()}`);
      setBills(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing data');
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFilters(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSearch = () => {
    fetchBills(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      customer_id: '',
      driver_id: '',
      min_amount: '',
      max_amount: '',
      start_date: null,
      end_date: null,
      payment_status: ''
    });
    fetchBills();
  };

  if (loading && bills.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Billing Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Customer ID"
              name="customer_id"
              value={filters.customer_id}
              onChange={handleFilterChange}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Driver ID"
              name="driver_id"
              value={filters.driver_id}
              onChange={handleFilterChange}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Amount"
              name="min_amount"
              type="number"
              value={filters.min_amount}
              onChange={handleFilterChange}
              placeholder="0.00"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Max Amount"
              name="max_amount"
              type="number"
              value={filters.max_amount}
              onChange={handleFilterChange}
              placeholder="999.99"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.start_date}
                onChange={(date) => handleDateChange('start_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.end_date}
                onChange={(date) => handleDateChange('end_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                name="payment_status"
                value={filters.payment_status}
                label="Payment Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSearch}
              sx={{ mr: 1 }}
            >
              Search
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Billing Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Ride ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No billing records found
                  </TableCell>
                </TableRow>
              ) : (
                bills
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((bill) => (
                    <TableRow key={bill.bill_id}>
                      <TableCell>{bill.bill_id}</TableCell>
                      <TableCell>{new Date(bill.date).toLocaleString()}</TableCell>
                      <TableCell>{bill.ride_id}</TableCell>
                      <TableCell>{bill.customer_id}</TableCell>
                      <TableCell>{bill.driver_id}</TableCell>
                      <TableCell>${bill.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={bill.payment_status}
                          color={
                            bill.payment_status === 'completed' ? 'success' :
                            bill.payment_status === 'failed' ? 'error' : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{bill.payment_method}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={bills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

export default BillingManagement;