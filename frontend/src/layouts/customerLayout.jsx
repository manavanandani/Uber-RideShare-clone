// src/layouts/CustomerLayout.jsx
import { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  History as HistoryIcon,
  NotificationsOutlined as NotificationIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

function CustomerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    
    // For Vite projects
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

  const drawer = (
    <div style={{ background: '#fff', height: '100%', borderRight: '1px solid #eee' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>
          Ride Sharing
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ mr: 2, width: 44, height: 44, bgcolor: '#222', color: '#fff', fontWeight: 700, fontSize: 22 }}>{user?.first_name?.[0] || 'C'}</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111' }}>{`${user?.first_name || ''} ${user?.last_name || ''}`}</Typography>
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>Customer</Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ mt: 1 }}>
        <ListItem button onClick={() => handleNavigation('/customer')} sx={{ borderLeft: window.location.pathname === '/customer' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/customer' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/customer' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/customer/book')} sx={{ borderLeft: window.location.pathname === '/customer/book' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/customer/book' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/customer/book' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><CarIcon /></ListItemIcon>
          <ListItemText primary="Book a Ride" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/customer/history')} sx={{ borderLeft: window.location.pathname === '/customer/history' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/customer/history' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/customer/history' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><HistoryIcon /></ListItemIcon>
          <ListItemText primary="Ride History" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/customer/profile')} sx={{ borderLeft: window.location.pathname === '/customer/profile' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/customer/profile' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/customer/profile' ? 700 : 500 }}>
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
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#000',
          color: '#fff',
          boxShadow: 'none',
          borderBottom: '1px solid #222',
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Customer Dashboard
          </Typography>
          <IconButton color="inherit">
            <NotificationIcon sx={{ color: '#fff' }} />
          </IconButton>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
            <Avatar alt={user?.first_name || 'User'} sx={{ bgcolor: '#fff', color: '#000', fontWeight: 700 }}>
              {user?.first_name?.[0] || 'U'}
            </Avatar>
          </IconButton>
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
              navigate('/customer/profile');
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

export default CustomerLayout;