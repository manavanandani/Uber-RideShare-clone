// src/pages/auth/RegisterAdmin.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

function RegisterAdmin() {
  const [formData, setFormData] = useState({
    admin_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'admin_id') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');
      
      // Format with hyphens
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
    } else if (name === 'phone') {
      // Only allow digits for phone number, max 10
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate SSN format
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(formData.admin_id)) {
      setError('Please enter a valid SSN in the format XXX-XX-XXXX');
      return;
    }
    
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
    
    // Validate password
    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/admin', formData);
      setSuccess('Admin account created successfully!');
      setTimeout(() => {
        navigate('/login?role=admin');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Uber black top bar with logo */}
      <Box sx={{ width: '100%', bgcolor: '#000', py: 2, px: 4, mb: 6 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'Inter, Uber Move, Arial, sans-serif', cursor: 'pointer' }}>
            Uber
          </Typography>
        </Link>
      </Box>
      <Container component="main" maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: '#222', width: 56, height: 56 }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 800, color: '#111', mb: 2, textAlign: 'left', width: '100%' }}>
              Register Admin Account
            </Typography>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
                {success}
              </Alert>
            )}
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="admin_id"
                    label="Admin ID (SSN format: XXX-XX-XXXX)"
                    name="admin_id"
                    value={formData.admin_id}
                    onChange={handleChange}
                    inputProps={{ maxLength: 11 }}
                    error={formData.admin_id && !(/^\d{3}-\d{2}-\d{4}$/.test(formData.admin_id))}
                    helperText="Enter your SSN in the format XXX-XX-XXXX"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="first_name"
                    label="First Name"
                    name="first_name"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="last_name"
                    label="Last Name"
                    name="last_name"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)}
                    helperText={formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email) ? "Invalid email format" : ""}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    inputProps={{ maxLength: 10 }}
                    error={formData.phone && !/^\d{10}$/.test(formData.phone)}
                    helperText="Must be exactly 10 digits"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={formData.password && formData.password.length < 4}
                    helperText={formData.password && formData.password.length < 4 ? "Password must be at least 4 characters" : ""}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="address"
                    label="Address"
                    name="address"
                    autoComplete="address-line1"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="city"
                    label="City"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel id="state-label">State</InputLabel>
                    <Select
                      labelId="state-label"
                      id="state"
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
                <Grid item xs={12} sm={3}>
                  <TextField
                    required
                    fullWidth
                    id="zip_code"
                    label="ZIP Code"
                    name="zip_code"
                    autoComplete="postal-code"
                    value={formData.zip_code}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                className="uber-btn"
                sx={{ mt: 3, mb: 2, background: '#000', color: '#fff', borderRadius: 999, fontWeight: 700, fontSize: '1.1em', py: 1.2, boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register Admin'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 4, width: '100%' }}>
                <span style={{ fontSize: 16, color: '#111', fontWeight: 500 }}>
                  Already have an account?{' '}
                  <Link to="/login?role=admin" style={{ textDecoration: 'none', color: '#000', fontWeight: 700 }}>
                    Sign in
                  </Link>
                </span>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default RegisterAdmin;