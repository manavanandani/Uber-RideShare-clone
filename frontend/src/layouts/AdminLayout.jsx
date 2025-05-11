// src/layouts/AdminLayout.jsx
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
  People as PeopleIcon,
  ExitToApp as LogoutIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

function AdminLayout() {
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
          Ride Sharing Admin
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ mr: 2, width: 44, height: 44, bgcolor: 'error.main', color: '#fff', fontWeight: 700, fontSize: 22 }}>{user?.first_name?.[0] || 'A'}</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111' }}>{`${user?.first_name || ''} ${user?.last_name || ''}`}</Typography>
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>Administrator</Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ mt: 1 }}>
        <ListItem button onClick={() => handleNavigation('/admin')} sx={{ borderLeft: window.location.pathname === '/admin' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/admin' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/admin' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/admin/drivers')} sx={{ borderLeft: window.location.pathname.includes('/admin/drivers') ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname.includes('/admin/drivers') ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname.includes('/admin/drivers') ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><CarIcon /></ListItemIcon>
          <ListItemText primary="Drivers" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/admin/customers')} sx={{ borderLeft: window.location.pathname.includes('/admin/customers') ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname.includes('/admin/customers') ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname.includes('/admin/customers') ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/admin/rides')} sx={{ borderLeft: window.location.pathname.includes('/admin/rides') ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname.includes('/admin/rides') ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname.includes('/admin/rides') ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><CarIcon /></ListItemIcon>
          <ListItemText primary="Rides" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/admin/billing')} sx={{ borderLeft: window.location.pathname.includes('/admin/billing') ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname.includes('/admin/billing') ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname.includes('/admin/billing') ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><ReceiptIcon /></ListItemIcon>
          <ListItemText primary="Billing" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/admin/analytics')} sx={{ borderLeft: window.location.pathname.includes('/admin/analytics') ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname.includes('/admin/analytics') ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname.includes('/admin/analytics') ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><AnalyticsIcon /></ListItemIcon>
          <ListItemText primary="Analytics" />
        </ListItem>
      </List>
      <Divider sx={{ mt: 2 }} />
      <List sx={{ mt: 1 }}>
        <ListItem button onClick={() => handleNavigation('/admin/profile')} sx={{ borderLeft: window.location.pathname === '/admin/profile' ? '4px solid #000' : '4px solid transparent', bgcolor: window.location.pathname === '/admin/profile' ? '#f6f6f6' : 'inherit', fontWeight: window.location.pathname === '/admin/profile' ? 700 : 500 }}>
          <ListItemIcon sx={{ color: '#111' }}><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
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
            Admin Dashboard
          </Typography>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <Avatar alt={user?.first_name || 'Admin'} sx={{ bgcolor: 'error.main', color: '#fff', fontWeight: 700 }}>
              {user?.first_name?.[0] || 'A'}
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
              navigate('/admin/profile');
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

export default AdminLayout;