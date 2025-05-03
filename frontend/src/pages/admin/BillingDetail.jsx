// src/pages/admin/BillingDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function BillingDetail() {
  const { billId } = useParams();
  const navigate = useNavigate();
  
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  useEffect(() => {
    fetchBillDetails();
  }, [billId]);
  
  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      if (!billId) {
        setError("No bill ID provided");
        setLoading(false);
        return;
      }
      const response = await api.get(`/billing/${billId}`);
      setBill(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bill details');
      setLoading(false);
    }
  };
  
  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/billing/${billId}`);
      setOpenDeleteDialog(false);
      navigate('/admin/billing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bill');
    }
  };
  
  const handleProcessPayment = async () => {
    try {
      await api.post(`/billing/${billId}/pay`, { payment_method: 'credit_card' });
      // Refresh bill data
      fetchBillDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };
  
  // Parse coordinates from source/destination strings
  const parseCoordinates = (coordinateString) => {
    if (!coordinateString) return null;
    
    try {
      const [latitude, longitude] = coordinateString.split(',').map(parseFloat);
      return { lat: latitude, lng: longitude };
    } catch {
      return null;
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
  
  if (!bill) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Bill not found.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/billing')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Bill #{bill.bill_id}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip 
          label={bill.payment_status} 
          color={getStatusColor(bill.payment_status)}
          sx={{ mx: 1 }}
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trip Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(bill.date).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Ride ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {bill.ride_id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Pickup Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(bill.pickup_time).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Dropoff Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(bill.dropoff_time).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Customer ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {bill.customer_id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Driver ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {bill.driver_id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Payment Method
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {bill.payment_method === 'credit_card' ? 'Credit Card' : 'Cash'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Distance
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {bill.distance_covered.toFixed(2)} km
                </Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, height: 300 }}>
              <MapWithMarkers
                pickup={parseCoordinates(bill.source_location)}
                dropoff={parseCoordinates(bill.destination_location)}
                showDirections={true}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" color="primary" align="center">
                ${bill.total_amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Total Amount
              </Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Base Fare</TableCell>
                    <TableCell align="right">${bill.breakdown.base_fare.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Distance ({bill.distance_covered.toFixed(2)} km)</TableCell>
                    <TableCell align="right">${bill.breakdown.distance_fare.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">${bill.breakdown.time_fare.toFixed(2)}</TableCell>
                  </TableRow>
                  {bill.breakdown.surge_multiplier > 1 && (
                    <TableRow>
                      <TableCell>Surge ({bill.breakdown.surge_multiplier.toFixed(1)}x)</TableCell>
                      <TableCell align="right">
                        ${(
                          (bill.total_amount - 
                            (bill.breakdown.base_fare + 
                             bill.breakdown.distance_fare + 
                             bill.breakdown.time_fare)
                          ).toFixed(2)
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${bill.total_amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              {bill.payment_status === 'pending' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleProcessPayment}
                >
                  Process Payment
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
              >
                Print Invoice
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete bill #{bill.bill_id}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
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

export default BillingDetail;