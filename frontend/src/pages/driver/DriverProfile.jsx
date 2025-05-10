// src/pages/driver/DriverProfile.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
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
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';

function DriverProfile() {
  const { user } = useSelector(state => state.auth);
  
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
    car_details: ''
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [openMediaDialog, setOpenMediaDialog] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If we already have user data from Redux, use it as a starting point
        if (user && user.driver_id) {
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zip_code: user.zip_code || '',
            car_details: user.car_details || ''
          });
          setProfile(user);
        }
        
        // Try to get full profile data from API
        const response = await driverService.getProfile(user.driver_id);
        if (response.data && response.data) {
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
            car_details: profileData.car_details || ''
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        car_details: profile.car_details || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await driverService.updateProfile(user.driver_id, formData);
      
      setSuccess('Profile updated successfully');
      // Update the profile data with the response
      if (response.data) {
        setProfile(response.data);
      }
      
      setEditMode(false);
      setUpdating(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setUpdating(false);
    }
  };

  const handleOpenMediaDialog = (type) => {
    setMediaType(type);
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
      
      
      // Refresh profile to show new media
      const profileResponse = await driverService.getProfile(user.driver_id);
      setProfile(profileResponse.data);
      
      setSuccess(`${mediaType === 'image' ? 'Image' : 'Video'} uploaded successfully`);
      handleCloseMediaDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    
    try {
      await driverService.deleteProfile(user.driver_id);
      
      // Log the user out and redirect to login page
      // You would typically dispatch a logout action here
      window.location.href = '/login';
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
        {/* Profile Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ width: 100, height: 100, mb: 2, fontSize: 40 }}
                  src={profile?.profile_image || ''}
                >
                  {profile?.first_name?.[0] || 'D'}
                </Avatar>
                <Typography variant="h5">
                  {profile?.first_name} {profile?.last_name}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Driver
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
                  Driver ID
                </Typography>
                <Typography variant="body1">
                  {profile?.driver_id || 'N/A'}
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
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicle Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Vehicle Details
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {profile?.car_details || 'No vehicle information provided'}
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
        
        {/* Tabs Section */}
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
                      <TextField
                        fullWidth
                        label="Vehicle Details"
                        name="car_details"
                        value={formData.car_details}
                        onChange={handleChange}
                        disabled={!editMode}
                        required
                        multiline
                        rows={4}
                        placeholder="Year, Make, Model, Color, License Plate Number"
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
                      onClick={() => handleOpenMediaDialog('image')}
                    >
                      Upload Image
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<VideoCallIcon />}
                      onClick={() => handleOpenMediaDialog('video')}
                    >
                      Upload Video
                    </Button>
                  </Box>
                  
                  {/* Display driver media */}
                  {profile && profile.intro_media && (
                    <Box>
                      {/* Show video if exists */}
                      {profile.intro_media.video_url && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Introduction Video
                          </Typography>
                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <video 
                              controls 
                              style={{ maxWidth: '100%', maxHeight: '400px' }}
                              src={`${import.meta.env.VITE_API_URL || ''}${profile.intro_media.video_url}`}
                            />
                          </Box>
                        </Box>
                      )}
                      
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
                                  alt={`Driver image ${index + 1}`}
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
                      
                      {!profile.intro_media.video_url && (!profile.intro_media.image_urls || profile.intro_media.image_urls.length === 0) && (
                        <Alert severity="info">
                          You haven't uploaded any media yet. Use the buttons above to add images or videos.
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
                    Customer Reviews
                  </Typography>
                  
                  {profile && profile.reviews && profile.reviews.length > 0 ? (
                    <List>
                      {profile.reviews.map((review, index) => (
                        <Box key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>{review.customer_id?.[0] || 'C'}</Avatar>
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
                      No reviews yet. Reviews will appear here after customers rate their rides with you.
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
          {mediaType === 'image' ? 'Upload Image' : 'Upload Video'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={mediaType === 'image' ? <PhotoCameraIcon /> : <VideoCallIcon />}
            >
              Select {mediaType === 'image' ? 'Image' : 'Video'} File
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {mediaFile && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Selected file: {mediaFile.name}
                </Typography>
                {mediaType === 'image' && (
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
                )}
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

export default DriverProfile;