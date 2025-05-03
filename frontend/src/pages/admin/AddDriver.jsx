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
  CircularProgress,
  Alert,
  MenuItem,
  Divider
} from '@mui/material';
import api from '../../services/api';

// Valid US states for dropdown
const validStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function AddDriver() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    driver_id: generateRandomSsn(),
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    car_details: '',
    account_status: 'approved' // Admin can directly approve drivers
  });
  
  // Generate SSN format ID
  function generateRandomSsn() {
    const part1 = Math.floor(Math.random() * 900 + 100).toString();
    const part2 = Math.floor(Math.random() * 90 + 10).toString();
    const part3 = Math.floor(Math.random() * 9000 + 1000).toString();
    return `${part1}-${part2}-${part3}`;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/drivers', formData);
      
      // Success! Navigate back to drivers list
      navigate('/admin/drivers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create driver');
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Add New Driver</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Driver Information</Typography>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Driver ID (Auto-generated)"
                value={formData.driver_id}
                disabled
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>Address Information</Typography>
              <Divider sx={{ mb: 2, mt: 1 }} />
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
              <TextField
                required
                select
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                {validStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                required
                fullWidth
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="12345 or 12345-6789"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>Vehicle Information</Typography>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Car Details"
                name="car_details"
                multiline
                rows={3}
                value={formData.car_details}
                onChange={handleChange}
                placeholder="Year, Make, Model, Color, License Plate Number"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/admin/drivers')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Add Driver'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
        </Paper>
    </Box>
  );
}
export default AddDriver;