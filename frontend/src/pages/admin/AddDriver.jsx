// src/pages/admin/AddDriver.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function AddDriver() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    driver_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    password: '',
    car_details: '',
    status: 'offline'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'driver_id') {
      // Format SSN as XXX-XX-XXXX
      const digitsOnly = value.replace(/\D/g, '');
      let formattedValue = '';
      if (digitsOnly.length <= 3) {
        formattedValue = digitsOnly;
      } else if (digitsOnly.length <= 5) {
        formattedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
      } else {
        formattedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5, 9)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
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
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      if (!formData.driver_id.match(/^\d{3}-\d{2}-\d{4}$/)) {
        setError('Driver ID must be in the format XXX-XX-XXXX');
        setLoading(false);
        return;
      }
      
      if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      if (!formData.phone.match(/^\d{10}$/)) {
        setError('Phone number must be 10 digits');
        setLoading(false);
        return;
      }
      
      if (formData.password.length < 4) {
        setError('Password must be at least 4 characters');
        setLoading(false);
        return;
      }
      
      const response = await api.post('/drivers', formData);
      
      // Redirect to drivers list
      navigate('/admin/drivers');
    } catch (err) {
      console.error('Error adding driver:', err);
      setError(err.response?.data?.message || 'Failed to add driver');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Driver
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Driver ID (SSN)"
                name="driver_id"
                value={formData.driver_id}
                onChange={handleChange}
                placeholder="XXX-XX-XXXX"
                inputProps={{ maxLength: 11 }}
                helperText="Format: XXX-XX-XXXX"
              />
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
              <TextField
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                helperText="Minimum 4 characters"
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Add Driver'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default AddDriver;