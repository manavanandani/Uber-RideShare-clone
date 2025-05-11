// src/pages/admin/DriversManagement.jsx
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

function DriversManagement() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, [page, rowsPerPage]);

  const fetchDrivers = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = query 
        ? `/drivers/search?name=${query}`
        : `/drivers?page=${page + 1}&limit=${rowsPerPage}`;
      
      const response = await api.get(endpoint);
      
      if (response.data && Array.isArray(response.data.data)) {
        setDrivers(response.data.data);
        setTotalCount(response.data.count || response.data.data.length);
      } else {
        setDrivers([]);
        setTotalCount(0);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.message || 'Failed to load drivers');
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
    fetchDrivers(searchQuery);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      fetchDrivers();
    }
  };

  const handleDeleteClick = (driver) => {
    setDriverToDelete(driver);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDriverToDelete(null);
  };

  const handleConfirmDelete = async () => {
  if (!driverToDelete) return;
  
  try {
    setDeleting(true);
    // Fix the endpoint URL
    await api.delete(`/drivers/delete/${driverToDelete.driver_id}`);
    
    // Remove from the list
    setDrivers(prevDrivers => 
      prevDrivers.filter(driver => driver.driver_id !== driverToDelete.driver_id)
    );
    
    setOpenDeleteDialog(false);
    setDriverToDelete(null);
    setDeleting(false);
    
    // Refresh the driver list to be sure
    fetchDrivers();
  } catch (err) {
    console.error('Error deleting driver:', err);
    setError(err.response?.data?.message || 'Failed to delete driver');
    setDeleting(false);
  }
};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Drivers Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/admin/drivers/add"
        >
          Add Driver
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
              label="Search drivers"
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
                <TableCell>Driver ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
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
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.driver_id}>
                    <TableCell>{driver.driver_id}</TableCell>
                    <TableCell>{`${driver.first_name} ${driver.last_name}`}</TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={driver.rating || 0} readOnly precision={0.5} size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({driver.rating ? driver.rating.toFixed(1) : 'N/A'})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={driver.status || 'Unknown'} 
                        color={
                          driver.status === 'available' ? 'success' :
                          driver.status === 'busy' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
  <IconButton 
    color="primary"
  onClick={() => navigate(`/admin/drivers/edit/${driver.driver_id}`)}
  >
    <EditIcon />
  </IconButton>
  <IconButton 
    color="error"
    onClick={() => handleDeleteClick(driver)}
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
            Are you sure you want to delete the driver {driverToDelete?.first_name} {driverToDelete?.last_name} ({driverToDelete?.driver_id})?
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

export default DriversManagement;