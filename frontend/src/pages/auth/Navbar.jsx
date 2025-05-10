import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Container>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/"
              startIcon={<HomeIcon />}
              sx={{ textTransform: 'none' }}
            >
              <Typography variant="h6" color="inherit" noWrap>
                RideShare
              </Typography>
            </Button>
          </Box>
          
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="primary" variant="outlined" component={Link} to="/register" sx={{ ml: 2 }}>
              Register
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;