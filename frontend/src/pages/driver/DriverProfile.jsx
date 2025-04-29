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
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import api from '../../services/api';
import MediaUploader from './MediaUploader';

function DriverProfile() {
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
    car_details: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch driver profile
        const response = await api.get(`/drivers/${user.driver_id}`);
        
        setProfile(response.data.data);
        
        // Set form data from profile
        setFormData({
          first_name: response.data.data.first_name || '',
          last_name: response.data.data.last_name || '',
          email: response.data.data.email || '',
          phone: response.data.data.phone || '',
          address: response.data.data.address || '',
          city: response.data.data.city || '',
          state: response.data.data.state || '',
          zip_code: response.data.data.zip_code || '',
          car_details: response.data.data.car_details || ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Update driver profile
      await api.put(`/drivers/${user.driver_id}`, formData);
      
      setSuccess('Profile updated successfully');
      setSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setSaving(false);
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
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={formData.state}
                      label="State"
                      onChange={handleChange}
                      required
                    >
                      {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map(state => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    multiline
                    rows={4}
                    required
                    placeholder="Year, Make, Model, Color, License Plate"
                    helperText="Please provide complete details about your vehicle"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
                  Driver ID
                </Typography>
                <Typography variant="body1">
                  {profile?.driver_id}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Account Status
                </Typography>
                <Typography variant="body1">
                  {profile?.status === 'available' ? 'Available' : 
                   profile?.status === 'busy' ? 'On a ride' : 'Offline'}
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
                      - Customer #{review.customer_id}
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

          <Card sx={{ my: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Media
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {profile?.intro_media && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Media
                  </Typography>
                  
                  {profile.intro_media.image_urls?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Images
                      </Typography>
                      <Grid container spacing={1}>
                        {profile.intro_media.image_urls.map((url, index) => (
                          <Grid item xs={6} sm={4} key={index}>
                            <img 
                              src={url} 
                              alt={`Driver ${index + 1}`} 
                              style={{ 
                                width: '100%', 
                                height: 100, 
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }} 
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {profile.intro_media.video_url && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Video
                      </Typography>
                      <video 
                        src={profile.intro_media.video_url} 
                        controls
                        style={{ 
                          width: '100%', 
                          maxHeight: 200,
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
              
              <MediaUploader 
                onUploadComplete={() => {
                  // Refresh profile after upload
                  driverService.getProfile(user.driver_id)
                    .then(response => {
                      setProfile(response.data.data);
                    })
                    .catch(err => {
                      setError('Failed to refresh profile after upload');
                    });
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
export default DriverProfile;