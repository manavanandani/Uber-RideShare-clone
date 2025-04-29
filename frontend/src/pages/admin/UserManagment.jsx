// src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Block as SuspendIcon
} from '@mui/icons-material';
import api from '../../services/api';

function UserManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({ drivers: [], customers: [] });
  const [error, setError] = useState(null);
  
  // Dialog states
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch drivers
      const driversResponse = await api.get('/drivers');
      
      // Fetch customers
      const customersResponse = await api.get('/customers');
      
      setUsers({
        drivers: driversResponse.data.data || [],
        customers: customersResponse.data.data || []
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Approve driver
  const handleApproveDriver = async () => {
    try {
      await api.post(`/admin/drivers/${selectedUser.driver_id}/review`, {
        status: 'approved',
        notes: reviewNote
      });
      
      setOpenApproveDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve driver');
    }
  };

  // Suspend user
  const handleSuspendUser = async () => {
    try {
      if (selectedUser.driver_id) {
        await api.post(`/admin/drivers/${selectedUser.driver_id}/review`, {
          status: 'suspended',
          notes: reviewNote
        });
      } else if (selectedUser.customer_id) {
        await api.post(`/admin/customers/${selectedUser.customer_id}/review`, {
          status: 'suspended',
          notes: reviewNote
        });
      }
      
      setOpenSuspendDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      if (selectedUser.driver_id) {
        await api.delete(`/drivers/${selectedUser.driver_id}`);
      } else if (selectedUser.customer_id) {
        await api.delete(`/customers/${selectedUser.customer_id}`);
      }
      
      setOpenDeleteDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getCurrentUsers = () => {
    return tabValue === 0 ? users.drivers : users.customers;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Drivers" />
          <Tab label="Customers" />
        </Tabs>
      </Paper>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentUsers().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentUsers()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.driver_id || user.customer_id}>
                      <TableCell>{user.driver_id || user.customer_id}</TableCell>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>
                        <div>{user.email}</div>
                        <div>{user.phone}</div>
                      </TableCell>
                      <TableCell>{`${user.city}, ${user.state}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.account_status || (user.status === 'available' ? 'Active' : user.status)}
                          color={
                            (user.account_status === 'approved' || user.status === 'available') ? 'success' :
                            user.account_status === 'suspended' ? 'error' :
                            user.account_status === 'pending_review' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.rating?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          {tabValue === 0 && user.account_status === 'pending_review' && (
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenApproveDialog(true);
                              }}
                            >
                              <ApproveIcon />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenSuspendDialog(true);
                            }}
                          >
                            <SuspendIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenDeleteDialog(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
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
          count={getCurrentUsers().length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Approve Driver Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
        <DialogTitle>Approve Driver</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve {selectedUser?.first_name} {selectedUser?.last_name} as a driver?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Review Notes"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApproveDriver} color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Suspend User Dialog */}
      <Dialog open={openSuspendDialog} onClose={() => setOpenSuspendDialog(false)}>
        <DialogTitle>Suspend User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to suspend {selectedUser?.first_name} {selectedUser?.last_name}?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Suspension"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSuspendDialog(false)}>Cancel</Button>
          <Button onClick={handleSuspendUser} color="error">
            Suspend
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedUser?.first_name} {selectedUser?.last_name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;