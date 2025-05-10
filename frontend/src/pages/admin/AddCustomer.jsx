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
    password: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    credit_card: {
      number: '',
      expiry: '',
      cvv: '',
      name_on_card: ''
    },
    account_status: 'active' // Admin can directly activate customers
  });
  
  const [validationErrors, setValidationErrors] = useState({
    email: false,
    phone: false,
    'credit_card.number': false,
    'credit_card.cvv': false,
    password: false
  });

  const [validationMessages, setValidationMessages] = useState({
    email: '',
    phone: '',
    'credit_card.number': '',
    'credit_card.cvv': '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate fields as they change
    let isValid = true;
    let errorMessage = '';
    
    if (name === 'email') {
      // Email validation using regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
      errorMessage = isValid ? '' : 'Please enter a valid email address';
    }
    
    if (name === 'phone') {
      // Phone validation - only digits and exactly 10 digits
      const phoneRegex = /^\d{10}$/;
      isValid = phoneRegex.test(value.replace(/\D/g, ''));
      errorMessage = isValid ? '' : 'Phone number must be 10 digits';
    }
    
    if (name === 'credit_card.number') {
      // Credit card validation - only digits and exactly 16 digits
      const ccRegex = /^\d{16}$/;
      isValid = ccRegex.test(value.replace(/\D/g, ''));
      errorMessage = isValid ? '' : 'Credit card must be 16 digits';
    }
    
    if (name === 'credit_card.cvv') {
      // CVV validation - only digits and exactly 3 digits
      const cvvRegex = /^\d{3}$/;
      isValid = cvvRegex.test(value.replace(/\D/g, ''));
      errorMessage = isValid ? '' : 'CVV must be 3 digits';
    }

    if (name === 'password') {
      // Password validation - at least 4 characters
      isValid = value.length >= 4;
      errorMessage = isValid ? '' : 'Password must be at least 4 characters';
    }    
    
    // Update validation states
    setValidationErrors(prev => ({
      ...prev,
      [name]: !isValid
    }));
    
    setValidationMessages(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    // Update form data (existing code)
    if (name.includes('.')) {
      // Handle nested objects like credit_card.number
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
    
    // Check all validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const ccRegex = /^\d{16}$/;
    const cvvRegex = /^\d{3}$/;
    
    const newValidationErrors = {
      email: !emailRegex.test(formData.email),
      phone: !phoneRegex.test(formData.phone.replace(/\D/g, '')),
      'credit_card.number': !ccRegex.test(formData.credit_card.number.replace(/\D/g, '')),
      'credit_card.cvv': !cvvRegex.test(formData.credit_card.cvv.replace(/\D/g, '')),
      password: formData.password.length < 4
    };
    
    const newValidationMessages = {
      email: newValidationErrors.email ? 'Please enter a valid email address' : '',
      phone: newValidationErrors.phone ? 'Phone number must be 10 digits' : '',
      'credit_card.number': newValidationErrors['credit_card.number'] ? 'Credit card must be 16 digits' : '',
      'credit_card.cvv': newValidationErrors['credit_card.cvv'] ? 'CVV must be 3 digits' : '',
      password: newValidationErrors.password ? 'Password must be at least 4 characters' : ''
    };
    
    setValidationErrors(newValidationErrors);
    setValidationMessages(newValidationMessages);
    
    // Check if any validation errors exist
    if (Object.values(newValidationErrors).some(error => error)) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/customers', formData);
      
      // Success! Navigate back to customers list
      navigate('/admin/customers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Add New Customer</Typography>
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
              <Typography variant="h6">Customer Information</Typography>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Customer ID (SSN Format: XXX-XX-XXXX)"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="123-45-6789"
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
                error={validationErrors.email}
                helperText={validationMessages.email}
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
                placeholder="10 digits"
                error={validationErrors.phone}
                helperText={validationMessages.phone}
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
                error={validationErrors.password}
                helperText={validationMessages.password}
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
              <Typography variant="h6" sx={{ mt: 2 }}>Payment Information</Typography>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Credit Card Number"
                name="credit_card.number"
                value={formData.credit_card.number}
                onChange={handleChange}
                placeholder="16-digit number with no spaces"
                error={validationErrors['credit_card.number']}
                helperText={validationMessages['credit_card.number']}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Name on Card"
                name="credit_card.name_on_card"
                value={formData.credit_card.name_on_card}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Expiry (MM/YY)"
                name="credit_card.expiry"
                value={formData.credit_card.expiry}
                onChange={handleChange}
                placeholder="MM/YY"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="CVV"
                name="credit_card.cvv"
                value={formData.credit_card.cvv}
                onChange={handleChange}
                placeholder="3 digits"
                error={validationErrors['credit_card.cvv']}
                helperText={validationMessages['credit_card.cvv']}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/admin/customers')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Add Customer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default AddCustomer;