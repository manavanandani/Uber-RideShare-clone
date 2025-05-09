// src/layouts/DriverLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Container,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  History as HistoryIcon,
  MonetizationOn as EarningsIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { driverService } from '../services/driverService';

const drawerWidth = 240;

function DriverLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isOnline, setIsOnline] = useState(false);
  const [driverStatus, setDriverStatus] = useState('offline');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add a function to load the driver's current status
  const loadDriverStatus = async () => {
    if (!user?.driver_id) return;
    
    try {
      const response = await driverService.getProfile(user.driver_id);
      if (response.data && response.data.status) {
        const newStatus = response.data.status;
        
        // Update both state values
        setDriverStatus(newStatus);
        setIsOnline(newStatus === 'available');
        
        console.log(`Updated driver status from server: ${newStatus}`);
      }
    } catch (error) {
      console.error('Error fetching driver status:', error);
    }
  };

  // Set up polling with a shorter interval (5 seconds)
  useEffect(() => {
    // Load status initially
    loadDriverStatus();
    
    // Set up polling
    const statusInterval = setInterval(loadDriverStatus, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(statusInterval);
  }, [user?.driver_id]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Simplified toggle handler that focuses only on the status change
  const handleToggleStatus = async (event) => {
    if (isUpdating) return; // Prevent double-clicks
    
    const wantsToBeOnline = event.target.checked;
    const newStatus = wantsToBeOnline ? 'available' : 'offline';
    
    // If already in the desired state, do nothing
    if ((newStatus === 'available' && isOnline) || 
        (newStatus === 'offline' && !isOnline)) {
      return;
    }
    
    // If busy, can't change status
    if (driverStatus === 'busy') {
      alert('Cannot change status while on an active ride');
      // Reset the switch to match the current state
      event.target.checked = isOnline;
      return;
    }
    
    setIsUpdating(true);
    console.log(`Attempting to change status to: ${newStatus}`);
    
    try {
      // Get location
      let currentLocation = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (locError) {
          console.warn('Could not get location:', locError);
          // Continue without location
        }
      }
      
      // Update UI state first for responsiveness
      setIsOnline(wantsToBeOnline);
      setDriverStatus(newStatus);
      
      // Make API call
      await driverService.updateStatus(
        user.driver_id, 
        newStatus, 
        currentLocation
      );
      
      console.log(`Status successfully changed to: ${newStatus}`);
      
      // Refresh status from server to confirm
      setTimeout(loadDriverStatus, 1000);
    } catch (error) {
      console.error('Failed to update status:', error);
      
      // Revert UI state on error
      setIsOnline(!wantsToBeOnline);
      setDriverStatus(wantsToBeOnline ? 'offline' : 'available');
      
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Ride Sharing
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2 }}>{user?.first_name?.[0] || 'D'}</Avatar>
        <Box>
          <Typography variant="subtitle1">{`${user?.first_name || ''} ${user?.last_name || ''}`}</Typography>
          <Typography variant="body2" color="textSecondary">Driver</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isOnline}
              onChange={handleToggleStatus}
              color="primary"
              disabled={driverStatus === 'busy' || isUpdating}
            />
          }
          label={driverStatus === 'busy' ? "On a Ride" : (isOnline ? "Online" : "Offline")}
        />
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigation('/driver')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/rides/available')}>
          <ListItemIcon>
            <CarIcon />
          </ListItemIcon>
          <ListItemText primary="Available Rides" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/rides/active')}>
          <ListItemIcon>
            <CarIcon />
          </ListItemIcon>
          <ListItemText primary="Active Ride" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/history')}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Ride History" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/earnings')}>
          <ListItemIcon>
            <EarningsIcon />
          </ListItemIcon>
          <ListItemText primary="Earnings" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Driver Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {driverStatus === 'busy' ? 'On a Ride' : (isOnline ? 'Online' : 'Offline')}
              </Typography>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: driverStatus === 'busy' ? 'warning.main' : (isOnline ? 'success.main' : 'text.disabled'),
                }}
              />
            </Box>
            <IconButton color="inherit">
              <NotificationIcon />
            </IconButton>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
              <Avatar alt={user?.first_name || 'User'}>
                {user?.first_name?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem onClick={() => {
              handleCloseUserMenu();
              navigate('/driver/profile');
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Profile</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              handleCloseUserMenu();
              handleLogout();
            }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default DriverLayout;