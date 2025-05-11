// src/pages/admin/BillingDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../../services/api';
import MapWithMarkers from '../../components/common/MapWithMarkers';

function BillingDetail() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [customer, setCustomer] = useState(null);
  
  useEffect(() => {
    fetchBillingDetails();
  }, [billId]);
  
  const fetchBillingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/billing/${billId}`);
      
      if (response.data && response.data.data) {
        const billingData = response.data.data;
        setBilling(billingData);
        
        // Fetch associated ride details
        if (billingData.ride_id) {
          try {
            const rideResponse = await api.get(`/rides/${billingData.ride_id}`);
            if (rideResponse.data && rideResponse.data.data) {
              setRide(rideResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching ride details:', err);
          }
        }
        
        // Fetch driver details
        if (billingData.driver_id) {
          try {
            const driverResponse = await api.get(`/drivers/${billingData.driver_id}`);
            if (driverResponse.data && driverResponse.data.data) {
              setDriver(driverResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching driver details:', err);
          }
        }
        
        // Fetch customer details
        if (billingData.customer_id) {
          try {
            const customerResponse = await api.get(`/customers/${billingData.customer_id}`);
            if (customerResponse.data && customerResponse.data.data) {
              setCustomer(customerResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching customer details:', err);
          }
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching billing details:', err);
      setError(err.response?.data?.message || 'Failed to load billing details');
      setLoading(false);
    }
  };
  
  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      
      await api.post(`/billing/${billId}/pay`, {
        payment_method: 'credit_card'
      });
      
      // Refresh billing details
      fetchBillingDetails();
      setOpenProcessDialog(false);
      setProcessing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
      setProcessing(false);
    }
  };
  
  const handleDeleteBilling = async () => {
    try {
      setDeleting(true);
      
      await api.delete(`/billing/${billId}`);
      
      // Redirect to billing list
      navigate('/admin/billing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete billing record');
      setDeleting(false);
      setOpenDeleteDialog(false);
    }
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!billing) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No billing record found with ID: {billId}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate('/admin/billing')}
          sx={{ mr: 2 }}
        >
          Back to Billings
        </Button>
        <Typography variant="h4" component="h1">
          Billing Details
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Main Billing Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Bill #{billing.bill_id}
              </Typography>
              <Chip
                label={billing.payment_status}
                color={getStatusColor(billing.payment_status)}
              />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(billing.date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Ride ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <Link to={`/admin/rides/${billing.ride_id}`} style={{ textDecoration: 'none' }}>
                    {billing.ride_id}
                  </Link>
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Pickup Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(billing.pickup_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Dropoff Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(billing.dropoff_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Distance Covered
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {billing.distance_covered.toFixed(2)} km
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Payment Method
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {billing.payment_method || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Price Breakdown
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Typography variant="body1">Base Fare:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body1" align="right">
                        {formatCurrency(billing.breakdown?.base_fare || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Typography variant="body1">Distance Fare:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body1" align="right">
                        {formatCurrency(billing.breakdown?.distance_fare || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Typography variant="body1">Time Fare:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body1" align="right">
                        {formatCurrency(billing.breakdown?.time_fare || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                {billing.breakdown?.surge_multiplier > 1 && (
                  <Box sx={{ mb: 1 }}>
                    <Grid container>
                      <Grid item xs={8}>
                        <Typography variant="body1">Surge Multiplier:</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body1" align="right">
                          {billing.breakdown.surge_multiplier.toFixed(2)}x
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ mb: 1 }}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Typography variant="h6">Total Amount:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h6" align="right" color="primary">
                        {formatCurrency(billing.total_amount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {billing.payment_status === 'pending' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => setOpenProcessDialog(true)}
                >
                  Process Payment
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete Billing
              </Button>
            </Box>
          </Paper>
          
          {/* Ride Map */}
          {ride && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ride Route
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {ride.pickup_location && ride.dropoff_location ? (
                  <MapWithMarkers
                    pickup={{
                      lat: ride.pickup_location.coordinates[1],
                      lng: ride.pickup_location.coordinates[0]
                    }}
                    dropoff={{
                      lat: ride.dropoff_location.coordinates[1],
                      lng: ride.dropoff_location.coordinates[0]
                    }}
                    showDirections={true}
                    height={300}
                  />
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}>
                    <Typography align="center" color="text.secondary">
                      Map data unavailable
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
        
        {/* Sidebar - Related Information */}
        <Grid item xs={12} md={4}>
          {/* Customer Info */}
          {customer && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List disablePadding>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Name" 
                      secondary={`${customer.first_name} ${customer.last_name}`} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Customer ID" 
                      secondary={
                        <Link to={`/admin/customers/${customer.customer_id}`} style={{ textDecoration: 'none' }}>
                          {customer.customer_id}
                        </Link>
                      } 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Email" 
                      secondary={customer.email} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Phone" 
                      secondary={customer.phone}
                      />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Rating" 
                      secondary={customer.rating ? customer.rating.toFixed(1) : 'N/A'} 
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Address" 
                      secondary={`${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code}`} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
          
          {/* Driver Info */}
          {driver && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Driver Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List disablePadding>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Name" 
                      secondary={`${driver.first_name} ${driver.last_name}`} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Driver ID" 
                      secondary={
                        <Link to={`/admin/drivers/${driver.driver_id}`} style={{ textDecoration: 'none' }}>
                          {driver.driver_id}
                        </Link>
                      } 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Email" 
                      secondary={driver.email} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Phone" 
                      secondary={driver.phone} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText 
                      primary="Rating" 
                      secondary={driver.rating ? driver.rating.toFixed(1) : 'N/A'} 
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Vehicle" 
                      secondary={driver.car_details || 'Not specified'} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
          
          {/* Payment Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Payment Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {formatCurrency(billing.total_amount)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={billing.payment_status}
                  color={getStatusColor(billing.payment_status)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Payment Method
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {billing.payment_method === 'credit_card' ? 'Credit Card' : 
                   billing.payment_method === 'cash' ? 'Cash' : 
                   'Not specified'}
                </Typography>
              </Box>
              
              {billing.payment_status === 'completed' && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(billing.payment_date || billing.updatedAt)}
                  </Typography>
                </Box>
              )}
              
              {billing.payment_status === 'pending' && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<CheckIcon />}
                  onClick={() => setOpenProcessDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Process Payment
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Process Payment Dialog */}
      <Dialog open={openProcessDialog} onClose={() => setOpenProcessDialog(false)}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to mark this payment as completed?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This action will update the payment status to "completed" and record the current date as the payment date.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcessDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessPayment} 
            variant="contained" 
            color="success"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Billing Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Billing Record</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this billing record?
          </Typography>
          <Typography variant="body2" color="error">
            This action cannot be undone. The record will be permanently removed from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteBilling} 
            variant="contained" 
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BillingDetail;