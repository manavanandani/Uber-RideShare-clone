// src/pages/customer/CustomerProfile.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
//import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { logout } from '../../store/slices/authSlice';

function CustomerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    credit_card: {
      number: '',
      expiry: '',
      cvv: '',
      name_on_card: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch customer profile
        const response = await customerService.getProfile(user.customer_id);
        
        setProfile(response.data);
        
        // Set form data from profile, ensuring all fields have at least empty string values
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zip_code: response.data.zip_code || '',
          credit_card: {
            number: response.data.credit_card?.number ? 
              '************' + (response.data.credit_card.number.slice(-4) || '') : '',
            expiry: response.data.credit_card?.expiry || '',
            cvv: response.data.credit_card?.cvv ? '***' : '',
            name_on_card: response.data.credit_card?.name_on_card || ''
          }
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };
    
    if (user?.customer_id) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate credit card number if it's been changed (not masked)
    if (formData.credit_card.number && !formData.credit_card.number.includes('*') && !/^\d{16}$/.test(formData.credit_card.number)) {
      setError('Credit card must be exactly 16 digits');
      return;
    }
    
    // Validate CVV if it's been changed (not masked)
    if (formData.credit_card.cvv && formData.credit_card.cvv !== '***' && !/^\d{3}$/.test(formData.credit_card.cvv)) {
      setError('CVV must be exactly 3 digits');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create a deep copy of the form data
      const submitData = JSON.parse(JSON.stringify(formData));
      
      // Handle credit card information
      if (submitData.credit_card) {
        // If the credit card number is masked (contains asterisks), we need to handle it
        if (submitData.credit_card.number && submitData.credit_card.number.includes('*')) {
          // Two options:
          // 1. Remove it completely to keep the existing number in the database
          delete submitData.credit_card.number;
          
          // 2. OR, if you want to indicate to the backend that the user didn't change it:
          // submitData.credit_card.number = 'UNCHANGED';
        }
        
        // Similarly for CVV
        if (submitData.credit_card.cvv === '***') {
          delete submitData.credit_card.cvv;
          // Or: submitData.credit_card.cvv = 'UNCHANGED';
        }
        
        // If the user has entered new values (no asterisks), they will be sent as-is
      }
      
      console.log('Submitting data:', JSON.stringify(submitData, null, 2));
      
      // Update profile
      await customerService.updateProfile(user.customer_id, submitData);
      
      setSuccess('Profile updated successfully');
      setSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Update error details:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  // Add deletion handler
const handleDeleteAccount = async () => {
  try {
    setDeleting(true);
    setError(null);
    
    console.log('Starting customer account deletion process');
    
    // Proceed with deletion
    const response = await customerService.deleteProfile(user.customer_id);
    console.log('Delete profile response:', response);
    
    // Log out the user
    dispatch(logout());
    
    // Navigate to home page
    navigate('/');
    
  } catch (err) {
    console.error('Profile deletion error:', err);
    setError(err.response?.data?.message || 'Failed to delete account');
    setDeleting(false);
    setShowDeleteDialog(false);
  }
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
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Payment Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    name="credit_card.number"
                    value={formData.credit_card.number}
                    onChange={handleChange}
                    required
                    inputProps={{ maxLength: 16 }}
                    helperText="Must be exactly 16 digits with no spaces"
                    error={formData.credit_card.number && !formData.credit_card.number.includes('*') && !/^\d{16}$/.test(formData.credit_card.number)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name on Card"
                    name="credit_card.name_on_card"
                    value={formData.credit_card.name_on_card}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date (MM/YY)"
                    name="credit_card.expiry"
                    value={formData.credit_card.expiry}
                    onChange={handleChange}
                    required
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    name="credit_card.cvv"
                    value={formData.credit_card.cvv}
                    onChange={handleChange}
                    required
                    type="password"
                    inputProps={{ maxLength: 3 }}
                    helperText="Must be exactly 3 digits"
                    error={formData.credit_card.cvv && formData.credit_card.cvv !== '***' && !/^\d{3}$/.test(formData.credit_card.cvv)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setShowDeleteDialog(true)}
                      startIcon={<DeleteIcon />}
                      sx={{ mt: 2 }}
                    >
                      Delete Account
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Customer ID
                </Typography>
                <Typography variant="body1">
                  {profile?.customer_id}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Rides
                </Typography>
                <Typography variant="body1">
                  {profile?.ride_history?.length || 0}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating
                    value={profile?.rating || 0}
                    precision={0.5}
                    readOnly
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {profile?.rating?.toFixed(1) || '0.0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reviews
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {profile?.reviews?.length > 0 ? (
                profile.reviews.slice(0, 5).map((review, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption">
                        {new Date(review.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      "{review.comment}"
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      - Driver #{review.driver_id}
                    </Typography>
                    {index < Math.min(profile.reviews.length - 1, 4) && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))
              ) : (
                <Typography variant="body2">
                  No reviews yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add delete dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: Your ride history and billing information will be retained for record-keeping purposes,
            but your personal information will be anonymized.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerProfile;