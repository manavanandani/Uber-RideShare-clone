// src/pages/auth/Register.jsx
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function Register() {
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
    
    // Step 3: Role-specific info
    // customer_id: generateRandomSsn(), // Generate SSN format ID
    // For customer
    customer_id: '',
    credit_card: {
      number: '',
      expiry: '',
      cvv: '',
      name_on_card: ''
    }
  });
  
  const { loading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  //function generateRandomSsn() {
  //  const part1 = Math.floor(Math.random() * 900 + 100).toString();
  //  const part2 = Math.floor(Math.random() * 90 + 10).toString();
  //  const part3 = Math.floor(Math.random() * 9000 + 1000).toString();
  //  return `${part1}-${part2}-${part3}`;
  //}

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (e.g., credit_card.number)
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
    
    // Add role
    const userData = { ...formData, role: 'customer' };
    
    dispatch(register(userData))
      .unwrap()
      .then(() => {
        navigate('/login?role=customer');
      })
      .catch(() => {
        // Error is handled by the reducer
      });
  };

  const steps = ['Personal Information', 'Address', 'Payment Details'];

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
                  Customer ID (SSN)
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="customer_id"
                  name="customer_id"
                  label="Social Security Number"
                  value={formData.customer_id}
                  onChange={handleChange}
                  placeholder='XXX-XX-XXXX'
                  helperText="Format: XXX-XX-XXXX"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="credit_card.number"
                  label="Credit Card Number"
                  name="credit_card.number"
                  value={formData.credit_card.number}
                  onChange={handleChange}
                  helperText="13-19 digits with no spaces"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="credit_card.expiry"
                  label="Expiry Date"
                  name="credit_card.expiry"
                  value={formData.credit_card.expiry}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  helperText="Format: MM/YY"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="credit_card.cvv"
                  label="CVV"
                  name="credit_card.cvv"
                  value={formData.credit_card.cvv}
                  onChange={handleChange}
                  helperText="3-4 digits"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="credit_card.name_on_card"
                  label="Name on Card"
                  name="credit_card.name_on_card"
                  value={formData.credit_card.name_on_card}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  const getErrorMessage = (errorText) => {
    if (errorText.includes('SSN')) {
      return (
        <>
          <strong>SSN already registered:</strong> {errorText}
        </>
      );
    } else if (errorText.includes('email')) {
      return (
        <>
          <strong>Email already in use:</strong> {errorText}
        </>
      );
    }
    return errorText;
  };

  return (
    <>
    <Navbar />
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 5, mb: 5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Customer Registration
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mt: 2,
                mb: 2,
                '& .MuiAlert-message': {
                  fontWeight: 'medium'
                }
              }}
            >
              {getErrorMessage(error)}
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
                >
                  Back
                </Button>
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Grid item>
              <Link to="/login" style={{ textDecoration: 'none', color: 'primary.main' }}>
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
    </>
  );
}

export default Register;