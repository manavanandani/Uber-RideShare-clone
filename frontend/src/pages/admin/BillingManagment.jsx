// src/pages/admin/BillingManagement.jsx
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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  
  // Search parameters
  const [customerIdSearch, setCustomerIdSearch] = useState('');
  const [driverIdSearch, setDriverIdSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');

  const handleSearchBills = async () => {
    try {
      setSearching(true);
      setError(null);
      
      let queryParams = new URLSearchParams();
      
      if (customerIdSearch) queryParams.append('customer_id', customerIdSearch);
      if (driverIdSearch) queryParams.append('driver_id', driverIdSearch);
      if (minAmount) queryParams.append('min_amount', minAmount);
      if (maxAmount) queryParams.append('max_amount', maxAmount);
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      if (paymentStatus !== 'all') queryParams.append('payment_status', paymentStatus);
      
      const response = await api.get(`/billing/search?${queryParams.toString()}`);
      setBills(response.data.data || []);
      setSearching(false);
      setPage(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search bills');
      setSearching(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (bill) => {
    setCurrentBill(bill);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/billing/${currentBill.bill_id}`);
      setOpenDeleteDialog(false);
      // Remove deleted bill from the list
      setBills(prev => prev.filter(bill => bill.bill_id !== currentBill.bill_id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bill');
    }
  };

  const clearSearchForm = () => {
    setCustomerIdSearch('');
    setDriverIdSearch('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setPaymentStatus('all');
  };

  // Add this to BillingManagement.jsx

useEffect(() => {
    // Load some initial billing data when the component mounts
    const fetchInitialBills = async () => {
      try {
        setLoading(true);
        // Get default bills (e.g., most recent)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const queryParams = new URLSearchParams({
          start_date: thirtyDaysAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        });
        
        const response = await api.get(`/billing/search?${queryParams.toString()}`);
        setBills(response.data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch recent bills');
        setLoading(false);
      }
    };
  
    fetchInitialBills();
  }, []); // Empty dependency array means it runs once on component mount
  
  // Get color for payment status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Bills
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Customer ID"
              value={customerIdSearch}
              onChange={(e) => setCustomerIdSearch(e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Driver ID"
              value={driverIdSearch}
              onChange={(e) => setDriverIdSearch(e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Amount ($)"
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Max Amount ($)"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                label="Payment Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={handleSearchBills}
              disabled={searching}
              sx={{ mr: 1 }}
              startIcon={<SearchIcon />}
            >
              {searching ? <CircularProgress size={24} /> : 'Search'}
            </Button>
            <Button onClick={clearSearchForm}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer ID</TableCell>
                <TableCell>Driver ID</TableCell>
                <TableCell>Amount</TableCell>
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
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No bills found. Use the search form above to find bills.
                  </TableCell>
                </TableRow>
              ) : (
                bills
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((bill) => (
                    <TableRow key={bill.bill_id}>
                      <TableCell>{bill.bill_id}</TableCell>
                      <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                      <TableCell>{bill.customer_id}</TableCell>
                      <TableCell>{bill.driver_id}</TableCell>
                      <TableCell>${bill.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={bill.payment_status} 
                          color={getStatusColor(bill.payment_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          component={Link}
                          to={`/admin/billing/${bill.bill_id}`}
                          size="small"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          size="small"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(bill)}
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
          count={bills.length}
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
            Are you sure you want to delete bill #{currentBill?.bill_id}? This action cannot be undone.
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
    </Box>
  );
}

export default BillingManagement;