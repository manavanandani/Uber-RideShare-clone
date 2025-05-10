// src/pages/auth/DriverApplication.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/slices/authSlice';
import Navbar from './Navbar';
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
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

function DriverApplication() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    
    // Step 2: Address Info
    address: '',
    city: '',
    state: '',
    zip_code: '',
    
    // Step 3: Vehicle Info
    // driver_id: generateRandomSsn(), // Generate SSN format ID
    driver_id: '',
    car_details: '',
  });
  
  const { loading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  //function generateRandomSsn() {
   // const part1 = Math.floor(Math.random() * 900 + 100).toString();
   // const part2 = Math.floor(Math.random() * 90 + 10).toString();
   // const part3 = Math.floor(Math.random() * 9000 + 1000).toString();
   // return `${part1}-${part2}-${part3}`;
 // }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate email
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      dispatch(clearError());
      dispatch({ type: 'auth/setError', payload: 'Invalid email format' });
      return;
    }
    
    // Validate phone
    if (!/^\d{10}$/.test(formData.phone)) {
      dispatch(clearError());
      dispatch({ type: 'auth/setError', payload: 'Phone number must be exactly 10 digits' });
      return;
    }
    
    // Validate password
    if (formData.password.length < 4) {
      dispatch(clearError());
      dispatch({ type: 'auth/setError', payload: 'Password must be at least 4 characters' });
      return;
    }
    
    // Add role
    const userData = { ...formData, role: 'driver' };
    
    dispatch(register(userData))
      .unwrap()
      .then(() => {
        navigate('/login?role=driver');
      })
      .catch(() => {
        // Error is handled by the reducer
      });
  };

  const steps = ['Personal Information', 'Address', 'Vehicle Information'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Grid container spacing={2}>
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
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="address"
                  label="Street Address"
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
                  placeholder="12345 or 12345-6789"
                  value={formData.zip_code}
                  onChange={handleChange}
                  helperText="Format: 12345 or 12345-6789"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Driver ID (SSN)
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="driver_id"
                  name="driver_id"
                  value={formData.driver_id}
                  label="Social Security Number"
                  onChange={handleChange}
                  placeholder="XXX-XX-XXXX"
                  helperText="Format: XXX-XX-XXXX"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Vehicle Information
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="car_details"
                  label="Vehicle Details"
                  name="car_details"
                  multiline
                  rows={4}
                  placeholder="Year, Make, Model, Color, License Plate Number"
                  value={formData.car_details}
                  onChange={handleChange}
                  helperText="Please provide complete details about your vehicle"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  When completed, submit application.
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return null;
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
      <Container component="main" maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: '#222', width: 56, height: 56 }}>
              <DirectionsCarIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 800, color: '#111', mb: 2, textAlign: 'left', width: '100%' }}>
              Driver Application
            </Typography>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ width: '100%', mt: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box component="form" noValidate sx={{ mt: 3 }}>
                {renderStepContent(activeStep)}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    className="uber-btn uber-btn-secondary"
                    sx={{ borderRadius: 999, fontWeight: 700, fontSize: '1.1em', py: 1.2, background: '#fff', color: '#000', border: '2px solid #000', boxShadow: 'none', '&:hover': { background: '#f6f6f6', color: '#000', borderColor: '#000' } }}
                  >
                    Back
                  </Button>
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="uber-btn"
                        sx={{ borderRadius: 999, fontWeight: 700, fontSize: '1.1em', py: 1.2, background: '#000', color: '#fff', boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Submit Application'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        className="uber-btn"
                        sx={{ borderRadius: 999, fontWeight: 700, fontSize: '1.1em', py: 1.2, background: '#000', color: '#fff', boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 4, width: '100%' }}>
              <span style={{ fontSize: 16, color: '#111', fontWeight: 500 }}>
                Already have a driver account?{' '}
                <Link to="/login?role=driver" style={{ textDecoration: 'none', color: '#000', fontWeight: 700 }}>
                  Sign in
                </Link>
              </span>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default DriverApplication;