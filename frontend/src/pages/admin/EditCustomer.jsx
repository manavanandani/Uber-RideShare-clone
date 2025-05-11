// src/pages/admin/EditCustomer.jsx
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

function EditCustomer() {
  const { customerId } = useParams();
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
    credit_card: {
      number: '',
      expiry: '',
      cvv: '',
      name_on_card: ''
    }
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching customer data for ID: ${customerId}`);
        const response = await api.get(`/customers/${customerId}`);
        
        if (response.data && response.data.data) {
          const customer = response.data.data;
          console.log('Customer data fetched successfully:', customer);
          
          setFormData({
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            zip_code: customer.zip_code || '',
            credit_card: {
              number: customer.credit_card?.number ? '************' + customer.credit_card.number.slice(-4) : '',
              expiry: customer.credit_card?.expiry || '',
              cvv: '***',
              name_on_card: customer.credit_card?.name_on_card || ''
            }
          });
        } else {
          console.error('Invalid customer data format received:', response.data);
          setError('Failed to load customer data. Invalid response format.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err.response?.data?.message || 'Failed to load customer data');
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Create a copy of the form data for submission
      const submitData = JSON.parse(JSON.stringify(formData));
      
      // Don't send masked credit card info
      if (submitData.credit_card.number.includes('*')) {
        delete submitData.credit_card.number;
      }
      if (submitData.credit_card.cvv === '***') {
        delete submitData.credit_card.cvv;
      }
      
      console.log(`Updating customer ${customerId} with data:`, submitData);
      const response = await api.patch(`/customers/${customerId}`, submitData);
      
      console.log('Customer updated successfully:', response.data);
      setSuccess('Customer updated successfully');
      setSaving(false);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/admin/customers');
      }, 1500);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.response?.data?.message || 'Failed to update customer');
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
        Edit Customer: {formData.first_name} {formData.last_name}
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
                Customer ID: {customerId}
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
                Payment Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Card Number (masked)"
                name="credit_card.number"
                value={formData.credit_card.number}
                onChange={handleChange}
                helperText="Leave as is to keep the current card number"
                disabled
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name on Card"
                name="credit_card.name_on_card"
                value={formData.credit_card.name_on_card}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="credit_card.expiry"
                value={formData.credit_card.expiry}
                onChange={handleChange}
                placeholder="MM/YY"
                helperText="Format: MM/YY"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CVV (masked)"
                name="credit_card.cvv"
                value={formData.credit_card.cvv}
                helperText="Leave as is to keep the current CVV"
                disabled
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/admin/customers')}
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

export default EditCustomer;