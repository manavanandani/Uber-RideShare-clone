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
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../../services/driverService';
import { logout } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function DriverProfile() {
  const { user } = useSelector(state => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
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
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      const response = await driverService.getProfile(user.driver_id);
      
      if (response && response.data) {
        const profileData = response.data;
        setProfile(profileData);
        
        // Initialize form data
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
    } catch (error) {
      console.error('Failed to load profile:', error);
      setErrorMessage('Failed to load profile. Please try again.');
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

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

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    // Reset form data to profile values
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
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await driverService.updateProfile(user.driver_id, formData);
      
      setProfile(response.data);
      setSuccessMessage('Profile updated successfully!');
      setOpenSnackbar(true);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first');
      setOpenSnackbar(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile); // This MUST match 'file' in backend
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      // Make API call
      const response = await driverService.uploadMedia(user.driver_id, formData);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Upload successful:', response);
      
      // Update profile image in UI
      if (response.data && response.data.intro_media) {
        setProfile(prev => ({
          ...prev,
          intro_media: response.data.intro_media
        }));
      }
      
      // Show success message
      setSuccessMessage('File uploaded successfully!');
      setOpenSnackbar(true);
      
      // Reset state
      setSelectedFile(null);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage('Failed to upload file. Please try again.');
      setOpenSnackbar(true);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAccount = () => {
    setOpenDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      await driverService.deleteProfile(user.driver_id);
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setErrorMessage('Failed to delete account. Please try again.');
      setOpenSnackbar(true);
      setLoading(false);
    }
    setOpenDeleteDialog(false);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const getProfileImageUrl = () => {
    if (profile?.intro_media?.profile_image) {
      return profile.intro_media.profile_image;
    } else if (profile?.intro_media?.image_urls && profile.intro_media.image_urls.length > 0) {
      return profile.intro_media.image_urls[0];
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Driver Profile
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
  src={getProfileImageUrl() ? 
    (getProfileImageUrl().startsWith('http') ? 
      getProfileImageUrl() : 
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${getProfileImageUrl()}`) 
    : null
  }
  sx={{ 
    width: 150, 
    height: 150, 
    mb: 2,
    fontSize: 64
  }}
  onError={(e) => {
    console.error('Avatar image failed to load:', getProfileImageUrl());
    e.target.src = null; // Fall back to initial
  }}
>
  {profile?.first_name?.[0] || 'D'}
</Avatar>
              
              <Typography variant="h5">
                {profile?.first_name} {profile?.last_name}
              </Typography>
              
              <Typography variant="body1" color="textSecondary" gutterBottom>
                Driver
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: profile?.status === 'available' ? 'success.main' : 
                             profile?.status === 'busy' ? 'warning.main' : 'text.disabled',
                    mr: 1
                  }}
                />
                <Typography variant="body2">
                  {profile?.status === 'available' ? 'Available' : 
                   profile?.status === 'busy' ? 'On a ride' : 'Offline'}
                </Typography>
              </Box>
              
              {profile?.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2">
                    Rating: {profile.rating.toFixed(1)} / 5.0
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
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
                <Typography variant="subtitle2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {profile?.email || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {profile?.phone || 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteAccount}
                sx={{ mt: 3 }}
                fullWidth
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                <Tab label="Personal Information" id="profile-tab-0" aria-controls="profile-tabpanel-0" />
                <Tab label="Vehicle Information" id="profile-tab-1" aria-controls="profile-tabpanel-1" />
                <Tab label="Media & Documents" id="profile-tab-2" aria-controls="profile-tabpanel-2" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {!editing ? (
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CancelIcon />} 
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!editing}
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
                      disabled={!editing}
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
                      disabled={!editing}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
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
                      disabled={!editing}
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
                      disabled={!editing}
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
                      disabled={!editing}
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
                      disabled={!editing}
                      required
                    />
                  </Grid>
                </Grid>
              </form>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {!editing ? (
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={handleEdit}
                  >
                    Edit Vehicle Information
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CancelIcon />} 
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Vehicle Details"
                      name="car_details"
                      value={formData.car_details}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                      multiline
                      rows={4}
                      placeholder="Year, Make, Model, Color, License Plate"
                    />
                  </Grid>
                </Grid>
              </form>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Profile Image
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
<Box sx={{ mb: 4 }}>
  <input
    accept="image/*"
    style={{ display: 'none' }}
    id="profile-image-upload"
    type="file"
    onChange={(event) => {
      setSelectedFile(event.target.files[0]);
      console.log('File selected:', event.target.files[0]);
    }}
  />
  <label htmlFor="profile-image-upload">
    <Button
      variant="outlined"
      component="span"
      startIcon={<UploadIcon />}
      disabled={uploading}
    >
      Select Image
    </Button>
  </label>
  
  {selectedFile && (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2">
        Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
      </Typography>
      
      <Button
        variant="contained"
        onClick={async () => {
          if (!selectedFile) {
            alert('Please select a file first');
            return;
          }
          
          setUploading(true);
          setUploadProgress(0);
          
          // Create form data
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          console.log('FormData created with field "file"');
          
          try {
            // Simulate progress
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 300);
            
            console.log('Making API call to upload media...');
            const response = await driverService.uploadMedia(user.driver_id, formData);
            console.log('Upload API response:', response);
            
            // Clear interval and set to 100%
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Reload the profile to get updated media
            fetchDriverProfile();
            
            setSuccessMessage('File uploaded successfully!');
            setOpenSnackbar(true);
            
            // Reset state
            setSelectedFile(null);
            setTimeout(() => {
              setUploading(false);
              setUploadProgress(0);
            }, 1000);
          } catch (error) {
            console.error('Upload failed:', error);
            setErrorMessage(`Failed to upload file: ${error.message}`);
            setOpenSnackbar(true);
            setUploading(false);
            setUploadProgress(0);
          }
        }}
        disabled={uploading}
        sx={{ mt: 1 }}
      >
        Upload Image
      </Button>
    </Box>
  )}
  
  {uploading && (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress variant="determinate" value={uploadProgress} />
      <Typography variant="body2" sx={{ mt: 1 }}>
        Uploading: {uploadProgress}%
      </Typography>
    </Box>
  )}
</Box>
              
              <Typography variant="h6" gutterBottom>
                Uploaded Images
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {profile?.intro_media?.image_urls && profile.intro_media.image_urls.length > 0 ? (
                  profile.intro_media.image_urls.map((url, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box 
                        sx={{ 
                          position: 'relative',
                          height: 150,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid #ccc',
                          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
                        }}
                      >
                        <img 
          src={url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`} 
                          alt={`Driver upload ${index}`} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }} 
                          onError={(e) => {
            console.error('Image failed to load:', url);
            e.target.src = 'https://via.placeholder.com/150?text=Image+Error';}}
                        />
                      </Box>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      No images uploaded yet.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={errorMessage ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {errorMessage || successMessage}
        </Alert>
      </Snackbar>
      
      {/* Delete Account Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including ride history and earnings information, will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteAccount} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DriverProfile;