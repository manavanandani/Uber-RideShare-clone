// src/pages/admin/EditDriver.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import api from '../../services/api';

function EditDriver() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    car_details: '',
    status: 'offline'
  });

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching driver data for ID: ${driverId}`);
        const response = await api.get(`/drivers/${driverId}`);
        
        if (response.data && response.data.data) {
          const driver = response.data.data;
          console.log('Driver data fetched successfully:', driver);
          
          setFormData({
            first_name: driver.first_name || '',
            last_name: driver.last_name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            address: driver.address || '',
            city: driver.city || '',
            state: driver.state || '',
            zip_code: driver.zip_code || '',
            car_details: driver.car_details || '',
            status: driver.status || 'offline'
          });
        } else {
          console.error('Invalid driver data format received:', response.data);
          setError('Failed to load driver data. Invalid response format.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching driver data:', err);
        setError(err.response?.data?.message || 'Failed to load driver data');
        setLoading(false);
      }
    };
    
    if (driverId) {
      fetchDriverData();
    }
  }, [driverId]);

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
      setError(null);
      setSuccess(null);
      
      console.log(`Updating driver ${driverId} with data:`, formData);
      const response = await api.put(`/drivers/${driverId}`, formData);
      
      console.log('Driver updated successfully:', response.data);
      setSuccess('Driver updated successfully');
      setSaving(false);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/admin/drivers');
      }, 1500);
    } catch (err) {
      console.error('Error updating driver:', err);
      setError(err.response?.data?.message || 'Failed to update driver');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Edit Driver: {formData.first_name} {formData.last_name}
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
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Driver ID: {driverId}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
                helperText="10 digits without dashes or spaces"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Address Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel>State</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  label="State"
                  onChange={handleChange}
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
            
            <Grid item xs={12} md={3}>
              <TextField
                required
                fullWidth
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                helperText="Format: 12345 or 12345-6789"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Vehicle Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Vehicle Details"
                name="car_details"
                value={formData.car_details}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Year, Make, Model, Color, License Plate Number"
                helperText="Enter the driver's vehicle information"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Driver Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Driver Status"
                  onChange={handleChange}
                >
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="busy">Busy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/admin/drivers')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default EditDriver;