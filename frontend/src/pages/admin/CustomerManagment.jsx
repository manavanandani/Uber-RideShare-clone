// src/pages/admin/CustomersManagement.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Rating,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../services/api';

function CustomersManagement() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage]);

const fetchCustomers = async (query = '') => {
  try {
    setLoading(true);
    setError(null);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    const endpoint = query 
      ? `/customers/search?name=${query}&_t=${timestamp}`
      : `/customers?page=${page + 1}&limit=${rowsPerPage}&_t=${timestamp}`;
    
    const response = await api.get(endpoint);
    
    if (response.data && Array.isArray(response.data.data)) {
      setCustomers(response.data.data);
      setTotalCount(response.data.count || response.data.data.length);
    } else {
      setCustomers([]);
      setTotalCount(0);
    }
    
    setLoading(false);
  } catch (err) {
    console.error('Error fetching customers:', err);
    setError(err.response?.data?.message || 'Failed to load customers');
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

  const handleSearch = () => {
    fetchCustomers(searchQuery);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      fetchCustomers();
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setCustomerToDelete(null);
  };

  // In CustomersManagement.jsx
const handleConfirmDelete = async () => {
  if (!customerToDelete) return;
  
  try {
    setDeleting(true);
    
    // Check the customer routes in your backend to find the correct delete endpoint
    // Use the following line if your backend is using '/customers/delete/:customer_id'
    await api.delete(`/customers/delete/${customerToDelete.customer_id}`);
    
    // Remove from the list
    setCustomers(prevCustomers => 
      prevCustomers.filter(customer => customer.customer_id !== customerToDelete.customer_id)
    );
    
    setOpenDeleteDialog(false);
    setCustomerToDelete(null);
    setDeleting(false);
    
    // Refresh the list to be sure
    fetchCustomers();
  } catch (err) {
    console.error('Error deleting customer:', err);
    setError(err.response?.data?.message || 'Failed to delete customer');
    setDeleting(false);
  }
};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Customers Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/admin/customers/add"
        >
          Add Customer
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search customers"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell>{customer.customer_id}</TableCell>
                    <TableCell>{`${customer.first_name} ${customer.last_name}`}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={customer.rating || 0} readOnly precision={0.5} size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({customer.rating ? customer.rating.toFixed(1) : 'N/A'})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
  <IconButton 
    color="primary"
    //onClick={() => navigate(`/admin/customers/${customer.customer_id}`)}
    onClick={() => navigate(`/admin/customers/edit/${customer.customer_id}`)}
  >
    <EditIcon />
  </IconButton>
  <IconButton 
    color="error"
    onClick={() => handleDeleteClick(customer)}
  >
    <DeleteIcon />
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the customer {customerToDelete?.first_name} {customerToDelete?.last_name} ({customerToDelete?.customer_id})?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomersManagement;