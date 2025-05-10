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
          background: '#fff',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          color: '#000',
          borderBottom: '1px solid #eee',
          py: { xs: 6, md: 10 },
        }}
      >
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold" sx={{ fontWeight: 900, fontSize: { xs: '2.5rem', md: '4rem' }, color: '#000', mb: 2, letterSpacing: '-0.03em' }}>
                Go anywhere with Uber
              </Typography>
              <Typography variant="h5" paragraph sx={{ color: '#222', fontWeight: 400, fontSize: '1.5rem', mb: 4 }}>
                Request a ride, hop in, and go. Anytime, anywhere.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  component={Link} 
                  to="/register"
                  className="uber-btn"
                  size="large"
                  style={{ background: '#000', color: '#fff', borderRadius: 999, fontWeight: 700 }}
                >
                  Sign Up to Ride
                </Button>
                <Button 
                  component={Link} 
                  to="/driver-application"
                  className="uber-btn"
                  size="large"
                  style={{ background: '#000', color: '#fff', borderRadius: 999, fontWeight: 700 }}
                >
                  Become a Driver
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: 420, borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', background: '#fff' }}>
                {/* More detailed SVG illustration (city/ride-sharing, Uber-like) */}
                <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block', borderRadius: 24 }}>
                  <rect width="800" height="600" rx="32" fill="#F7F7F7"/>
                  <ellipse cx="600" cy="520" rx="120" ry="30" fill="#E0E0E0"/>
                  <ellipse cx="200" cy="520" rx="120" ry="30" fill="#E0E0E0"/>
                  {/* City buildings */}
                  <rect x="100" y="200" width="40" height="180" rx="8" fill="#BDBDBD"/>
                  <rect x="160" y="160" width="30" height="220" rx="8" fill="#E0E0E0"/>
                  <rect x="210" y="240" width="30" height="140" rx="8" fill="#BDBDBD"/>
                  <rect x="600" y="180" width="40" height="200" rx="8" fill="#BDBDBD"/>
                  <rect x="660" y="220" width="30" height="160" rx="8" fill="#E0E0E0"/>
                  <rect x="710" y="260" width="30" height="120" rx="8" fill="#BDBDBD"/>
                  {/* Car body */}
                  <rect x="320" y="400" width="160" height="60" rx="20" fill="#222"/>
                  {/* Car windows */}
                  <rect x="340" y="410" width="50" height="30" rx="8" fill="#fff"/>
                  <rect x="410" y="410" width="50" height="30" rx="8" fill="#fff"/>
                  {/* Car wheels */}
                  <circle cx="350" cy="470" r="18" fill="#fff" stroke="#222" strokeWidth="6"/>
                  <circle cx="470" cy="470" r="18" fill="#fff" stroke="#222" strokeWidth="6"/>
                  {/* Driver */}
                  <ellipse cx="400" cy="430" rx="10" ry="14" fill="#FFD600"/>
                  <rect x="395" y="420" width="10" height="20" rx="5" fill="#FFD600"/>
                  {/* Passengers */}
                  <ellipse cx="430" cy="440" rx="8" ry="12" fill="#90CAF9"/>
                  <rect x="426" y="435" width="8" height="16" rx="4" fill="#90CAF9"/>
                  {/* Road */}
                  <rect x="100" y="480" width="600" height="16" rx="8" fill="#BDBDBD"/>
                  {/* Sun */}
                  <circle cx="700" cy="100" r="32" fill="#FFD600" fillOpacity="0.3"/>
                </svg>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Lower Section with subtle background */}
      <Box sx={{ bgcolor: '#f7f7f7', minHeight: '40vh', py: 8 }}>
        <Container>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 800, color: '#000', fontSize: '2.2rem', mb: 2 }}>
            Log in to your account
          </Typography>
          <Typography variant="body1" align="center" sx={{ color: '#888', fontSize: '1.1rem', mb: 4 }}>
            Choose your account type below
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} className="uber-card" sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon fontSize="large" className="uber-icon" sx={{ mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>Customers</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, flexGrow: 1, color: '#444' }}>
                  Book rides, track your journey, and manage your profile.
                </Typography>
                <Button 
                  component={Link}
                  to="/login?role=customer"
                  className="uber-btn"
                  fullWidth
                >
                  Customer Login
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} className="uber-card" sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CarIcon fontSize="large" className="uber-icon" sx={{ mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>Drivers</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, flexGrow: 1, color: '#444' }}>
                  Accept ride requests, navigate routes, and track your earnings.
                </Typography>
                <Button 
                  component={Link}
                  to="/login?role=driver"
                  className="uber-btn"
                  fullWidth
                >
                  Driver Login
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} className="uber-card" sx={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AdminIcon fontSize="large" className="uber-icon" sx={{ mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>Administrators</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, flexGrow: 1, color: '#444' }}>
                  Manage users, monitor system activity, and analyze metrics.
                </Typography>
                <Button 
                  component={Link}
                  to="/login?role=admin"
                  className="uber-btn"
                  fullWidth
                >
                  Admin Login
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className="uber-section" sx={{ bgcolor: '#f6f6f6', py: 8 }}>
        <Container>
          {/* Hero Illustration above the section (inline SVG) */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <svg width="320" height="100" viewBox="0 0 320 100" fill="none">
              <rect x="0" y="30" width="320" height="40" rx="20" fill="#E3F2FD"/>
              <rect x="120" y="50" width="80" height="20" rx="10" fill="#1976D2"/>
              <circle cx="160" cy="60" r="10" fill="#FFD600"/>
              <rect x="150" y="40" width="20" height="10" rx="5" fill="#fff"/>
            </svg>
          </Box>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 800, color: '#000', fontSize: '2rem', mb: 2 }}>
            Why Choose Our Service
          </Typography>
          <Typography variant="body1" align="center" sx={{ color: '#888', fontSize: '1.1rem', mb: 4 }}>
            Experience the best ride-sharing service with these amazing features
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="uber-card" sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {/* Inline SVG for Safe and Secure */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="10" y="20" width="60" height="40" rx="12" fill="#E3F2FD"/>
                      <path d="M40 30L50 40L40 50L30 40L40 30Z" fill="#1976D2"/>
                      <circle cx="40" cy="40" r="6" fill="#fff"/>
                    </svg>
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Safe and Secure
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    All rides are tracked in real-time and driver backgrounds are thoroughly verified.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="uber-card" sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {/* Inline SVG for Transparent Pricing */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="15" y="25" width="50" height="30" rx="8" fill="#FFF8E1"/>
                      <rect x="25" y="35" width="30" height="10" rx="3" fill="#FFD600"/>
                      <text x="40" y="47" textAnchor="middle" fontSize="18" fill="#222" fontWeight="bold">$</text>
                    </svg>
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Transparent Pricing
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Know exactly what you'll pay before you book with our upfront pricing model.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="uber-card" sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {/* Inline SVG for Fast Pickup */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="10" y="50" width="60" height="10" rx="5" fill="#E0E0E0"/>
                      <rect x="30" y="40" width="20" height="10" rx="5" fill="#90CAF9"/>
                      <circle cx="35" cy="55" r="5" fill="#222"/>
                      <circle cx="45" cy="55" r="5" fill="#222"/>
                      <rect x="38" y="35" width="4" height="10" rx="2" fill="#FFD600"/>
                    </svg>
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Fast Pickup
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Our optimized algorithm ensures the closest driver is always assigned to you.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#000', color: '#fff', py: 6 }}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                Ride Sharing Simulation
              </Typography>
              <Typography variant="body2" sx={{ color: '#bbb', fontSize: '1rem', mt: 1 }}>
                A distributed systems project implementing a ride-sharing service similar to Uber.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                Quick Links
              </Typography>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/register" className="uber-link">
                    Register as Customer
                  </Link>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/driver-application" className="uber-link">
                    Become a Driver
                  </Link>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Link to="/login" className="uber-link">
                    Login
                  </Link>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: '#bbb', fontSize: '1rem', mt: 1 }} paragraph>
                San Jose State University<br />
                Distributed Systems for Data Engineering<br />
                Spring 2025
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, bgcolor: '#222' }} />
          <Typography variant="body2" sx={{ color: '#bbb', textAlign: 'center', fontSize: '0.95rem' }}>
            © {new Date().getFullYear()} Ride Sharing Simulation. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Landing;