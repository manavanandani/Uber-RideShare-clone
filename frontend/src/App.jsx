// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getCurrentUser } from './store/slices/authSlice';

// Import theme
import theme from './theme';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import BookRide from './pages/customer/BookRide';
import RideTracking from './pages/customer/RideTracking';
import CustomerProfile from './pages/customer/CustomerProfile';
import RideHistory from './pages/customer/RideHistory';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import AvailableRides from './pages/driver/AvailableRides';
import DriverProfile from './pages/driver/DriverProfile';
import DriverRideHistory from './pages/driver/RideHistory';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemAnalytics from './pages/admin/SystemAnalytics';
import BillingManagement from './pages/admin/BillingManagement';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import DriverLayout from './layouts/DriverLayout';
import AdminLayout from './layouts/AdminLayout';

function App() {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // Check if user is authenticated on app load
  useEffect(() => {
    if (localStorage.getItem('token') && !isAuthenticated && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, loading]);
  
  // Protected route component
  const ProtectedRoute = ({ children, roles }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (roles && !roles.includes(user?.role)) {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Customer routes */}
          <Route 
            path="/customer" 
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerDashboard />} />
            <Route path="book" element={<BookRide />} />
            <Route path="ride/:rideId" element={<RideTracking />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="history" element={<RideHistory />} />
          </Route>
          
          {/* Driver routes */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={['driver']}>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DriverDashboard />} />
            <Route path="rides" element={<AvailableRides />} />
            <Route path="profile" element={<DriverProfile />} />
            <Route path="history" element={<DriverRideHistory />} />
          </Route>
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<SystemAnalytics />} />
            <Route path="billing" element={<BillingManagement />} />
          </Route>
          
          {/* Default redirect based on role */}
          <Route path="/" element={
            isAuthenticated ? (
              user?.role === 'customer' ? <Navigate to="/customer" /> :
              user?.role === 'driver' ? <Navigate to="/driver" /> :
              user?.role === 'admin' ? <Navigate to="/admin" /> :
              <Navigate to="/login" />
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;