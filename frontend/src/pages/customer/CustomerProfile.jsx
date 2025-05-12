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
  Avatar,
  Rating,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { customerService } from '../../services/customerService';
import { logout } from '../../store/slices/authSlice';

function CustomerProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
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
  
  const [tabValue, setTabValue] = useState(0);
  const [openMediaDialog, setOpenMediaDialog] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use redux as starting point if available
        if (user && user.customer_id) {
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zip_code: user.zip_code || '',
            credit_card: {
              number: '************' + (user.credit_card?.number?.slice(-4) || ''),
              expiry: user.credit_card?.expiry || '',
              cvv: '***',
              name_on_card: user.credit_card?.name_on_card || ''
            }
          });
          setProfile(user);
        }
        
        // Get full profile data from API
        const response = await customerService.getProfile(user.customer_id);
        if (response.data) {
          const profileData = response.data;
          setProfile(profileData);
          
          // Update form data with complete profile
          setFormData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            city: profileData.city || '',
            state: profileData.state || '',
            zip_code: profileData.zip_code || '',
            credit_card: {
              number: profileData.credit_card?.number ? 
                '************' + (profileData.credit_card.number.slice(-4) || '') : '',
              expiry: profileData.credit_card?.expiry || '',
              cvv: profileData.credit_card?.cvv ? '***' : '',
              name_on_card: profileData.credit_card?.name_on_card || ''
            }
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    // If canceling edit, reset form data
    if (editMode) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        credit_card: {
          number: profile.credit_card?.number ? 
            '************' + (profile.credit_card.number.slice(-4) || '') : '',
          expiry: profile.credit_card?.expiry || '',
          cvv: profile.credit_card?.cvv ? '***' : '',
          name_on_card: profile.credit_card?.name_on_card || ''
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setError('Invalid email format');
      return;
    }
    
    // Validate phone
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    
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
      setUpdating(true);
      
      // Create a deep copy of the form data
      const submitData = JSON.parse(JSON.stringify(formData));
      
      // Handle credit card information
      if (submitData.credit_card) {
        // Handle if credit card number is masked
        if (submitData.credit_card.number && submitData.credit_card.number.includes('*')) {
          delete submitData.credit_card.number;
        }
        
        // Similarly for CVV
        if (submitData.credit_card.cvv === '***') {
          delete submitData.credit_card.cvv;
        }
        
      }
      
      console.log('Submitting data:', JSON.stringify(submitData, null, 2));
      
      // Update profile
      await customerService.updateProfile(user.customer_id, submitData);
      
      setSuccess('Profile updated successfully');
      setUpdating(false);
      setEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Update error details:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setUpdating(false);
    }
  };

  const handleOpenMediaDialog = () => {
    setMediaFile(null);
    setOpenMediaDialog(true);
  };

  const handleCloseMediaDialog = () => {
    setOpenMediaDialog(false);
    setMediaFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleUploadMedia = async () => {
    if (!mediaFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', mediaFile);
      
      const response = await customerService.uploadMedia(user.customer_id, formData);
      
      // Refresh profile to show new media
      const profileResponse = await customerService.getProfile(user.customer_id);
      setProfile(profileResponse.data);
      
      setSuccess('Image uploaded successfully');
      handleCloseMediaDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    
    try {
      await customerService.deleteProfile(user.customer_id);
      
      // Log the user out and redirect to login page
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
      setOpenDeleteDialog(false);
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
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ width: 100, height: 100, mb: 2, fontSize: 40 }}
                  src={profile?.intro_media?.image_urls?.length > 0 
                    ? `http://localhost:5000${profile.intro_media.image_urls[0]}` 
                    : ''}
                >
                  {profile?.first_name?.[0] || 'C'}
                </Avatar>
                <Typography variant="h5">
                  {profile?.first_name} {profile?.last_name}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Customer
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Rating value={profile?.rating || 0} precision={0.5} readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({profile?.rating?.toFixed(1) || 'No ratings'})
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Customer ID
                </Typography>
                <Typography variant="body1">
                  {profile?.customer_id || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email
                </Typography>
                <Typography variant="body1">
                  {profile?.email || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1 }} /> Phone
                </Typography>
                <Typography variant="body1">
                  {profile?.phone || 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1 }} /> Address
                </Typography>
                <Typography variant="body1">
                  {profile?.address}, {profile?.city}, {profile?.state} {profile?.zip_code}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Edit Profile" />
              <Tab label="Media" />
              <Tab label="Reviews" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Edit Profile Tab */}
              {tabValue === 0 && (
                <Box component="form" onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant={editMode ? "outlined" : "contained"}
                      color={editMode ? "error" : "primary"}
                      startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                      onClick={toggleEditMode}
                      sx={{ mr: 1 }}
                      disabled={updating}
                    >
                      {editMode ? 'Cancel' : 'Edit Profile'}
                    </Button>
                    
                    {editMode && (
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={updating}
                      >
                        {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                      </Button>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={!editMode}
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
                        disabled={!editMode}
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
                        disabled={!editMode}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editMode}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!editMode}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!editMode}
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
                        disabled={!editMode}
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
                        disabled={!editMode}
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
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Name on Card"
                        name="credit_card.name_on_card"
                        value={formData.credit_card.name_on_card}
                        onChange={handleChange}
                        disabled={!editMode}
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
                        disabled={!editMode}
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
                        disabled={!editMode}
                        required
                        type="password"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Media Tab */}
              {tabValue === 1 && (
                <Box>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={handleOpenMediaDialog}
                    >
                      Upload Image
                    </Button>
                  </Box>
                  
                  {/* Display customer media */}
                  {profile && profile.intro_media && (
                    <Box>
                      {/* Show images if exist */}
                      {profile.intro_media.image_urls && profile.intro_media.image_urls.length > 0 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Profile Images
                          </Typography>
                          <Grid container spacing={2}>
                            {profile.intro_media.image_urls.map((url, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Box
                                  component="img"
                                  sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: 1
                                  }}
                                  src={`http://localhost:5000${url}`}
                                  alt={`Customer image ${index + 1}`}
                                  onError={(e) => {
                                    console.error(`Failed to load image: ${url}`);
                                    e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                                  }}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                      
                      {(!profile.intro_media.image_urls || profile.intro_media.image_urls.length === 0) && (
                        <Alert severity="info">
                          You haven't uploaded any images yet. Use the button above to add images.
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Reviews Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Driver Reviews
                  </Typography>
                  
                  {profile && profile.reviews && profile.reviews.length > 0 ? (
                    <List>
                      {profile.reviews.map((review, index) => (
                        <Box key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>{review.driver_id?.[0] || 'D'}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Rating value={review.rating} readOnly size="small" />
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {new Date(review.date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {review.comment || 'No comment provided'}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < profile.reviews.length - 1 && <Divider variant="inset" component="li" />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No reviews yet. Reviews will appear here after drivers rate their rides with you.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Media Upload Dialog */}
      <Dialog open={openMediaDialog} onClose={handleCloseMediaDialog}>
        <DialogTitle>
          Upload Image
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={<PhotoCameraIcon />}
            >
              Select Image File
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {mediaFile && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Selected file: {mediaFile.name}
                </Typography>
                <Box
                  component="img"
                  sx={{
                    mt: 2,
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'contain',
                  }}
                  src={URL.createObjectURL(mediaFile)}
                  alt="Preview"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMediaDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUploadMedia} 
            color="primary" 
            variant="contained"
            disabled={!mediaFile || uploadLoading}
          >
            {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={deletingAccount}
          >
            {deletingAccount ? <CircularProgress size={24} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerProfile;