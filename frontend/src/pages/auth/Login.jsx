// src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';
import Navbar from './Navbar';
import {
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function Login() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleParam || 'customer'
  });

  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToDashboard();
    }
  }, [isAuthenticated, user, navigate]);

  const redirectToDashboard = () => {
    if (user.role === 'customer') {
      navigate('/customer');
    } else if (user.role === 'driver') {
      navigate('/driver');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
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
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ m: 1, bgcolor: '#222', width: 56, height: 56 }}>
              <LockOutlinedIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 800, color: '#111', mb: 2, textAlign: 'left', width: '100%' }}>
              Sign in
            </Typography>
          </Box>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              variant="standard"
              InputProps={{ style: { fontSize: 18 } }}
              InputLabelProps={{ style: { fontWeight: 600 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              variant="standard"
              InputProps={{ style: { fontSize: 18 } }}
              InputLabelProps={{ style: { fontWeight: 600 } }}
            />
            <FormControl fullWidth margin="normal" variant="standard">
              <InputLabel id="role-label" style={{ fontWeight: 600 }}>Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleChange}
                sx={{ fontSize: 18 }}
              >
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
              sx={{ mt: 1, mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              className="uber-btn"
              sx={{ mt: 2, mb: 3, background: '#000', color: '#fff', borderRadius: 999, fontWeight: 700, fontSize: '1.1em', py: 1.2, boxShadow: 'none', border: 'none', '&:hover': { background: '#222', color: '#fff' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="#" style={{ textDecoration: 'none', color: '#111', fontWeight: 500, fontSize: 16 }}>
                Forgot password?
              </Link>
              <br />
              <span style={{ fontSize: 16, color: '#111', fontWeight: 500 }}>
                Don't have an account?{' '}
                <Link
                  to={
                    formData.role === 'driver'
                      ? '/driver-application'
                      : formData.role === 'admin'
                      ? '/register-admin'
                      : '/register'
                  }
                  style={{ textDecoration: 'none', color: '#000', fontWeight: 700 }}
                >
                  Sign Up
                </Link>
              </span>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;