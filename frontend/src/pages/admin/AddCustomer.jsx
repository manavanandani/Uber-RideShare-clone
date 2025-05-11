// src/pages/admin/AddCustomer.jsx
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

function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    password: '',
    credit_card: {
      number: '',
      expiry: '',
      cvv: '',
      name_on_card: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'customer_id') {
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
    } else if (name.includes('.')) {
      // Handle nested properties like credit_card.number
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
  
  try {
    setLoading(true);
    setError(null);
    
    // Validate inputs
    if (!formData.customer_id.match(/^\d{3}-\d{2}-\d{4}$/)) {
      setError('Customer ID must be in the format XXX-XX-XXXX');
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
    
    // Validate credit card
    if (!formData.credit_card.number.match(/^\d{16}$/)) {
      setError('Credit card number must be 16 digits');
      setLoading(false);
      return;
    }
    
    if (!formData.credit_card.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      setError('Expiry date must be in the format MM/YY');
      setLoading(false);
      return;
    }
    
    if (!formData.credit_card.cvv.match(/^\d{3}$/)) {
      setError('CVV must be 3 digits');
      setLoading(false);
      return;
    }
    
    const response = await api.post('/customers', formData);
    
    // Force reload to show new customer
    window.location.href = '/admin/customers';
  } catch (err) {
    console.error('Error adding customer:', err);
    setError(err.response?.data?.message || 'Failed to add customer');
    setLoading(false);
  }
};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Customer
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
                label="Customer ID (SSN)"
                name="customer_id"
                value={formData.customer_id}
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
                Payment Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Credit Card Number"
                name="credit_card.number"
                value={formData.credit_card.number}
                onChange={handleChange}
                inputProps={{ maxLength: 16 }}
                helperText="16 digits without spaces"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="Name on Card"
                name="credit_card.name_on_card"
                value={formData.credit_card.name_on_card}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="Expiry Date"
                name="credit_card.expiry"
                value={formData.credit_card.expiry}
                onChange={handleChange}
                placeholder="MM/YY"
                helperText="Format: MM/YY"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="CVV"
                name="credit_card.cvv"
                value={formData.credit_card.cvv}
                onChange={handleChange}
                inputProps={{ maxLength: 3 }}
                helperText="3 digits"
                type="password"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/admin/customers')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Add Customer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default AddCustomer;