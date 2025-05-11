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
    if (import.meta.env.DEV && window.__REDUX_DEVTOOLS_EXTENSION__) {
      window.__REDUX_DEVTOOLS_EXTENSION__.disconnect();
    }
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
    <div style={{ background: '#fff', height: '100%', borderRight: '1px solid #eee' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>
          Ride Sharing
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ mr: 2, width: 44, height: 44, bgcolor: '#222', color: '#fff', fontWeight: 700, fontSize: 22 }}>{user?.first_name?.[0] || 'D'}</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111' }}>{`${user?.first_name || ''} ${user?.last_name || ''}`}</Typography>
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>Driver</Typography>
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
      <List sx={{ mt: 1 }}>
        <ListItem button onClick={() => handleNavigation('/driver')} sx={{ borderLeft: window.location.pathname === '/driver' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/rides/available')} sx={{ borderLeft: window.location.pathname === '/driver/rides/available' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver/rides/available' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver/rides/available' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><CarIcon /></ListItemIcon>
          <ListItemText primary="Available Rides" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/rides/active')} sx={{ borderLeft: window.location.pathname === '/driver/rides/active' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver/rides/active' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver/rides/active' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><CarIcon /></ListItemIcon>
          <ListItemText primary="Active Ride" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/history')} sx={{ borderLeft: window.location.pathname === '/driver/history' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver/history' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver/history' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><HistoryIcon /></ListItemIcon>
          <ListItemText primary="Ride History" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/earnings')} sx={{ borderLeft: window.location.pathname === '/driver/earnings' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver/earnings' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver/earnings' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><EarningsIcon /></ListItemIcon>
          <ListItemText primary="Earnings" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/driver/profile')} sx={{ borderLeft: window.location.pathname === '/driver/profile' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/driver/profile' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/driver/profile' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
      <Divider sx={{ mt: 2 }} />
      <List sx={{ mt: 1 }}>
        <ListItem button onClick={handleLogout} sx={{ color: '#d32f2f', fontWeight: 700 }}>
          <ListItemIcon sx={{ color: '#d32f2f' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Black Uber-style top bar */}
      <Box sx={{
        width: '100%',
        bgcolor: '#000',
        py: 0,
        px: 4,
        height: 64,
        position: 'fixed',
        zIndex: 1201,
        left: { sm: `${drawerWidth}px` },
        right: 0,
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
        borderRadius: '0 0 24px 24px',
      }}>
        {/* Left: Title */}
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'Inter, Uber Move, Arial, sans-serif', display: 'flex', alignItems: 'center', pl: 2 }}>
          Driver Dashboard
        </Typography>
        {/* Right: Online/Offline Toggle, Status Dot, Avatar, Notification */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isOnline}
                onChange={handleToggleStatus}
                color="success"
                disabled={driverStatus === 'busy' || isUpdating}
              />
            }
            label={driverStatus === 'busy' ? 'On a Ride' : (isOnline ? 'Online' : 'Offline')}
            sx={{ color: '#fff', mr: 2, '.MuiFormControlLabel-label': { color: '#fff', fontWeight: 700 } }}
          />
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: driverStatus === 'busy' ? 'warning.main' : (isOnline ? 'success.main' : 'text.disabled'),
              mr: 3,
              border: '2px solid #fff',
            }}
          />
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <NotificationIcon sx={{ color: '#fff' }} />
          </IconButton>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 2, transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'scale(1.08)', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)' } }}>
            <Avatar
              alt={user?.first_name || 'User'}
              src={user?.intro_media?.image_urls?.length > 0 ? `http://localhost:5000${user.intro_media.image_urls[0]}` : ''}
              sx={{ width: 48, height: 48, bgcolor: '#fff', color: '#000', fontWeight: 700, border: '3px solid #fff', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.10)' }}
            >
              {user?.first_name?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            sx={{ mt: '45px', '& .MuiPaper-root': { borderRadius: 3, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)', zIndex: 2000 } }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            disablePortal={false}
          >
            <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/driver/profile'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Profile</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleCloseUserMenu(); handleLogout(); }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        {/* Add top padding to account for the fixed black bar */}
        <Toolbar sx={{ minHeight: 64 }} />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default DriverLayout;