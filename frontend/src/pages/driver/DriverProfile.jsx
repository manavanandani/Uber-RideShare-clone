// src/pages/driver/DriverProfile.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
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
  CardMedia,
  Rating,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';

function DriverProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
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
    car_details: ''
  });
  
  // New state for address update form
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // States for account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch driver profile
        const response = await driverService.getProfile(user.driver_id);
        
        setProfile(response.data);
        
        // Set form data from profile
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zip_code: response.data.zip_code || '',
          car_details: response.data.car_details || ''
        });
        
        // Also initialize the address form
        setAddressForm({
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zip_code: response.data.zip_code || ''
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };
    
    if (user?.driver_id) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler for address form changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await driverService.updateProfile(user.driver_id, formData);
      
      // Update local state
      setProfile(prev => ({ ...prev, ...formData }));
      setSuccess('Profile updated successfully');
      setSaving(false);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setSaving(false);
    }
  };
  
  // Function to handle address update
  const handleUpdateAddress = async () => {
    try {
      setUpdatingLocation(true);
      setError(null);
      
      // Validate form fields
      if (!addressForm.address || !addressForm.city || !addressForm.state || !addressForm.zip_code) {
        setError('All address fields are required');
        setUpdatingLocation(false);
        return;
      }
      
      // Call the service to update address
      await driverService.updateAddress(user.driver_id, addressForm);
      
      // Update the profile state with new address data
      setProfile(prev => ({
        ...prev,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zip_code
      }));
      
      // Also update the main form data
      setFormData(prev => ({
        ...prev,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zip_code
      }));
      
      setSuccess('Location updated successfully');
      setUpdatingLocation(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update location');
      setUpdatingLocation(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current profile data
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        car_details: profile.car_details || ''
      });
    }
    setIsEditing(false);
  };
  
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingMedia(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      await driverService.uploadMedia(user.driver_id, formData);
      
      // Refresh profile to get updated media
      const response = await driverService.getProfile(user.driver_id);
      setProfile(response.data);
      
      setUploadingMedia(false);
      setSuccess('Media uploaded successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload media');
      setUploadingMedia(false);
    }
  };

const handleDeleteAccount = async () => {
  try {
    setDeleting(true);
    setError(null);
    
    console.log('Starting driver account deletion process');
    
    // Proceed with deletion
    const response = await driverService.deleteProfile(user.driver_id);
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
        Driver Profile
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
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                sx={{ height: 140 }}
                image={profile?.intro_media?.image_urls?.[0] || "https://via.placeholder.com/400x200?text=Driver+Profile"}
                title="Driver Profile"
              />
              <Box sx={{ position: 'absolute', bottom: -40, left: 24 }}>
                <Avatar 
                  sx={{ width: 80, height: 80, border: '4px solid white' }}
                  alt={profile?.first_name || 'User'}
                >
                  {profile?.first_name?.[0] || 'D'}
                </Avatar>
              </Box>
              <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                <input
                  accept="image/*"
                  id="upload-profile-photo"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleMediaUpload}
                />
                <label htmlFor="upload-profile-photo">
                  <IconButton 
                    color="primary" 
                    aria-label="upload picture" 
                    component="span"
                    disabled={uploadingMedia}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    {uploadingMedia ? <CircularProgress size={24} /> : <CameraIcon />}
                  </IconButton>
                </label>
              </Box>
            </Box>
            <CardContent sx={{ pt: 6 }}>
              <Typography variant="h5" gutterBottom>
                {profile?.first_name} {profile?.last_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating 
                  value={profile?.rating || 0} 
                  precision={0.5} 
                  readOnly 
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {profile?.rating?.toFixed(1) || '0.0'} ({profile?.reviews?.length || 0} reviews)
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Vehicle: {profile?.car_details || 'Not specified'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Driver ID: {profile?.driver_id}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Member Since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Status: {profile?.status?.charAt(0).toUpperCase() + profile?.status?.slice(1) || 'Offline'}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Current Location: {profile?.intro_media?.location?.coordinates ? 
                    `${profile.intro_media.location.coordinates[1].toFixed(4)}, ${profile.intro_media.location.coordinates[0].toFixed(4)}` : 
                    'Not set'}
                </Box>
              </Typography>
            </CardContent>
          </Card>
          
          {/* Reviews Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reviews
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {profile?.reviews && profile.reviews.length > 0 ? (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {profile.reviews.slice(0, 5).map((review, index) => (
                    <ListItem key={index} divider={index < Math.min(4, profile.reviews.length - 1)}>
                      <ListItemAvatar>
                        <Avatar>
                          {review.customer_id[0] || 'C'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              Customer #{review.customer_id}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon sx={{ color: 'warning.main', fontSize: 18, mr: 0.5 }} />
                              <Typography variant="body2">{review.rating}</Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2">
                              "{review.comment}"
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(review.date).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No reviews yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Personal Information</Typography>
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ) : (
                <Box>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save'}
                  </Button>
                </Box>
              )}
            </Box>
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Vehicle Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Car Details"
                    name="car_details"
                    value={formData.car_details}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    multiline
                    rows={3}
                    placeholder="Year, Make, Model, Color, License Plate"
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          {/* New section for updating location */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Location
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Enter your current address to update your location. This will be used to match you with nearby ride requests.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address"
                  value={addressForm.address}
                  onChange={handleAddressChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={addressForm.city}
                  onChange={handleAddressChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={addressForm.state}
                  onChange={handleAddressChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  name="zip_code"
                  value={addressForm.zip_code}
                  onChange={handleAddressChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleUpdateAddress}
                  disabled={updatingLocation}
                  startIcon={<LocationIcon />}
                >
                  {updatingLocation ? <CircularProgress size={24} /> : 'Update Location'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Account Deletion Section */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'error.light' }}>
            <Typography variant="h6" gutterBottom color="error">
              Delete Account
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              If you delete your account, your personal information will be anonymized, but your ride history and ratings will be maintained in the system for record-keeping purposes.
            </Typography>
            
            <Button
              variant="contained"
              color="error"
              onClick={() => setShowDeleteDialog(true)}
              startIcon={<DeleteIcon />}
            >
              Delete My Account
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>
          Delete Your Account?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Your personal information will be anonymized, but your ride history and ratings will be maintained in the system.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DriverProfile;