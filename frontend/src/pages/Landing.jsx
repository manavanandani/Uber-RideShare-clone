// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Typography, 
  Paper,
  Card,
  CardContent,
  CardMedia,
  Divider
} from '@mui/material';
import { 
  DirectionsCar as CarIcon, 
  Person as PersonIcon, 
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

function Landing() {
  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(/images/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '80vh',
          display: 'flex',
          alignItems: 'center',
          color: 'white'
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Ride Made Simple
              </Typography>
              <Typography variant="h5" paragraph>
                Request a ride, hop in, and go. Anytime, anywhere.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  component={Link} 
                  to="/register"
                  variant="contained" 
                  size="large"
                  color="primary"
                >
                  Sign Up to Ride
                </Button>
                <Button 
                  component={Link} 
                  to="/driver-application"
                  variant="outlined" 
                  size="large"
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Become a Driver
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Login Options Section */}
      <Container sx={{ my: 8 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Log in to your account
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          Choose your account type below
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h5">Customers</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Book rides, track your journey, and manage your profile.
              </Typography>
              <Button 
                component={Link}
                to="/login?role=customer"
                variant="contained" 
                fullWidth
              >
                Customer Login
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CarIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h5">Drivers</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Accept ride requests, navigate routes, and track your earnings.
              </Typography>
              <Button 
                component={Link}
                to="/login?role=driver"
                variant="contained" 
                fullWidth
              >
                Driver Login
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AdminIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h5">Administrators</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                Manage users, monitor system activity, and analyze metrics.
              </Typography>
              <Button 
                component={Link}
                to="/login?role=admin"
                variant="contained" 
                fullWidth
              >
                Admin Login
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Why Choose Our Service
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" paragraph>
            Experience the best ride-sharing service with these amazing features
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Safe and Secure
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    All rides are tracked in real-time and driver backgrounds are thoroughly verified.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <MoneyIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Transparent Pricing
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Know exactly what you'll pay before you book with our upfront pricing model.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <SpeedIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Fast Pickup
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Our optimized algorithm ensures the closest driver is always assigned to you.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Ride Sharing Simulation
              </Typography>
              <Typography variant="body2" color="textSecondary">
                A distributed systems project implementing a ride-sharing service similar to Uber.
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                    Register as Customer
                  </Link>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/driver-application" style={{ textDecoration: 'none', color: 'inherit' }}>
                    Become a Driver
                  </Link>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                    Login
                  </Link>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                San Jose State University<br />
                Distributed Systems for Data Engineering<br />
                Spring 2025
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="textSecondary" align="center">
            © {new Date().getFullYear()} Ride Sharing Simulation. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Landing;