// src/pages/admin/BillingManagement.jsx
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
  Alert,
  Collapse,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateRangeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import api from '../../services/api';

function BillingManagement() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalBillings: 0,
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchBillings();
    fetchBillingStats();
  }, [page, rowsPerPage]);

  const fetchBillingStats = async () => {
  try {
    const response = await api.get('/stats/billing-summary');
    
    if (response.data && response.data.data) {
      setStats(response.data.data);
    }
  } catch (err) {
    console.error('Error fetching billing stats:', err);
    // Don't set error state to avoid disrupting the main UI
  }
};
  const fetchBillings = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query params
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', page + 1);
      queryParams.append('limit', rowsPerPage);
      
      // Add filters
      const filtersToApply = { ...filter, ...filterParams };
      
      if (filtersToApply.status && filtersToApply.status !== 'all') {
        queryParams.append('payment_status', filtersToApply.status);
      }
      
      if (filtersToApply.startDate) {
        queryParams.append('start_date', filtersToApply.startDate);
      }
      
      if (filtersToApply.endDate) {
        queryParams.append('end_date', filtersToApply.endDate);
      }
      
      if (filtersToApply.minAmount) {
        queryParams.append('min_amount', filtersToApply.minAmount);
      }
      
      if (filtersToApply.maxAmount) {
        queryParams.append('max_amount', filtersToApply.maxAmount);
      }
      
      if (filtersToApply.searchQuery) {
        queryParams.append('search', filtersToApply.searchQuery);
      }
      
      // Make the API call
      const response = await api.get(`/billing/search?${queryParams.toString()}`);
      
      if (response.data) {
        setBillings(response.data.data || []);
        setTotalCount(response.data.count || 0);
        fetchBillingStats();
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching billings:', err);
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
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchBillings();
  };

  const resetFilters = () => {
    setFilter({
      status: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      searchQuery: ''
    });
    setPage(0);
    fetchBillings({
      status: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      searchQuery: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Billing Management
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Billings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Completed Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {stats.completedPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Pending Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {stats.pendingPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search by ID, customer or driver"
            variant="outlined"
            size="small"
            name="searchQuery"
            value={filter.searchQuery}
            onChange={handleFilterChange}
            onKeyPress={handleSearchKeyPress}
            sx={{ width: '40%' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Button
              variant="outlined"
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
        
        <Collapse in={showFilters}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={filter.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Min Amount"
                name="minAmount"
                value={filter.minAmount}
                onChange={handleFilterChange}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Amount"
                name="maxAmount"
                value={filter.maxAmount}
                onChange={handleFilterChange}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button 
                variant="outlined" 
                color="error" 
                fullWidth
                startIcon={<ClearIcon />}
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="datetime-local"
                value={filter.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="datetime-local"
                value={filter.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Billing Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
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
              ) : billings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No billing records found.
                  </TableCell>
                </TableRow>
              ) : (
                billings.map((bill) => (
                  <TableRow key={bill.bill_id} hover>
                    <TableCell>{bill.bill_id}</TableCell>
                    <TableCell>{formatDate(bill.date)}</TableCell>
                    <TableCell>{bill.customer_id}</TableCell>
                    <TableCell>{bill.driver_id}</TableCell>
                    <TableCell>{formatCurrency(bill.total_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={bill.payment_status}
                        color={getStatusColor(bill.payment_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        component={Link} 
                        to={`/admin/billing/${bill.bill_id}`}
                        color="primary"
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
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