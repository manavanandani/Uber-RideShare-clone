// src/pages/admin/DriversManagement.jsx
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function DriversManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers');
      setDrivers(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch drivers');
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (driver) => {
    setCurrentDriver(driver);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/drivers/${currentDriver.driver_id}`);
      setOpenDeleteDialog(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  // Filter drivers based on search term only (removed status filter)
  const filteredDrivers = drivers.filter(driver => {
    return searchTerm === '' || 
      driver.driver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      (driver.car_details && driver.car_details.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Drivers Management</Typography>
        <Button
          component={Link}
          to="/admin/drivers/add"
          variant="contained"
          startIcon={<AddIcon />}
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
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by ID, name, email, phone, or car details"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={fetchDrivers}>
                Refresh List
              </Button>
            </Box>
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
                <TableCell>Contact</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((driver) => (
                    <TableRow key={driver.driver_id}>
                      <TableCell>{driver.driver_id}</TableCell>
                      <TableCell>{`${driver.first_name} ${driver.last_name}`}</TableCell>
                      <TableCell>
                        <div>{driver.email}</div>
                        <div>{driver.phone}</div>
                      </TableCell>
                      <TableCell>{driver.car_details}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon sx={{ color: 'warning.main', fontSize: '1rem', mr: 0.5 }} />
                          <Typography variant="body2">
                            {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          component={Link}
                          to={`/admin/drivers/${driver.driver_id}`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(driver)}
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDrivers.length}
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
            Are you sure you want to delete driver {currentDriver?.first_name} {currentDriver?.last_name}? This action cannot be undone.
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

export default DriversManagement;