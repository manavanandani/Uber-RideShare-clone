// Updated App.jsx with fixes for admin rendering

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getCurrentUser } from './store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

// Theme
import theme from './theme';

// Layout Components
import Navbar from './components/layout/Navbar';
import CustomerLayout from './layouts/CustomerLayout';
import DriverLayout from './layouts/DriverLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DriverApplication from './pages/auth/DriverApplication';
import RegisterAdmin from './pages/auth/RegisterAdmin';
import NotFound from './pages/NotFound';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import BookRide from './pages/customer/BookRide';
import RideTracking from './pages/customer/RideTracking';
import RideHistory from './pages/customer/RideHistory';
import CustomerProfile from './pages/customer/CustomerProfile';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import AvailableRides from './pages/driver/AvailableRides';
import ActiveRide from './pages/driver/ActiveRide';
import DriverRideHistory from './pages/driver/RideHistory';
import RideDetail from './pages/driver/RideDetail';
import Earnings from './pages/driver/Earnings';
import DriverProfile from './pages/driver/DriverProfile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import DriversManagement from './pages/admin/DriversManagment';
import CustomersManagement from './pages/admin/CustomerManagment';
import RidesManagement from './pages/admin/RidesManagment';
import BillingManagement from './pages/admin/BillingManagment';
// Instead of importing Analytics directly, let's use lazy loading
import AddDriver from './pages/admin/AddDriver';
import AddCustomer from './pages/admin/AddCustomer';
import BillingDetail from './pages/admin/BillingDetail';
import AdminProfile from './pages/admin/AdminProfile';
import RideDetailView from './pages/admin/RideDetailView';
import EditDriver from './pages/admin/EditDriver';
import EditCustomer from './pages/admin/EditCustomer';

// Lazy load Analytics to avoid the import error if it doesn't exist yet
const Analytics = React.lazy(() => 
  import('./pages/admin/Analytics')
    .catch(() => ({ 
      default: () => <div>Analytics component is under development</div> 
    }))
);

function App() {
  useEffect(() => {
    window.addEventListener('popstate', () => {
      window.location.reload();
    });
    
    return () => {
      window.removeEventListener('popstate', () => {});
    };
  }, []);

  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser())
        .unwrap()
        .then(() => {
          setAuthChecked(true);
        })
        .catch(() => {
          // If token is invalid, clear it
          localStorage.removeItem('token');
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, [dispatch]);

  // Show loading spinner while checking authentication
  if (!authChecked) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Protected route component
  const ProtectedRoute = ({ children, roles }) => {
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (roles && !roles.includes(user?.role)) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'customer') {
        return <Navigate to="/customer" replace />;
      } else if (user?.role === 'driver') {
        return <Navigate to="/driver" replace />;
      } else if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
    
    return children;
  };

  // Public route component - redirects to dashboard if already authenticated
  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      if (user?.role === 'customer') {
        return <Navigate to="/customer" replace />;
      } else if (user?.role === 'driver') {
        return <Navigate to="/driver" replace />;
      } else if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
    }
    
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/driver-application" element={<PublicRoute><DriverApplication /></PublicRoute>} />
          <Route path="/register-admin" element={<PublicRoute><RegisterAdmin /></PublicRoute>} />
          
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
            <Route path="history" element={<RideHistory />} />
            <Route path="profile" element={<CustomerProfile />} />
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
            <Route path="rides/available" element={<AvailableRides />} />
            <Route path="rides/active" element={<ActiveRide />} />
            <Route path="history" element={<DriverRideHistory />} />
            <Route path="history/:rideId" element={<RideDetail />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="profile" element={<DriverProfile />} />
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
            
            {/* Driver management */}
            <Route path="drivers" element={<DriversManagement />} />
            <Route path="drivers/add" element={<AddDriver />} />
            <Route path="drivers/edit/:driverId" element={<EditDriver />} />
            <Route path="drivers/:driverId" element={<DriverProfile />} />
            
            {/* Customer management */}
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="customers/add" element={<AddCustomer />} />
            <Route path="customers/edit/:customerId" element={<EditCustomer />} />
            <Route path="customers/:customerId" element={<CustomerProfile />} />
            
            {/* Ride management */}
            <Route path="rides" element={<RidesManagement />} />
            <Route path="rides/:rideId" element={<RideDetail />} />
            
            {/* Billing management */}
            <Route path="billing" element={<BillingManagement />} />
            <Route path="billing/:billId" element={<BillingDetail />} />
            
            {/* Analytics */}
            <Route path="analytics" element={
              <React.Suspense fallback={<CircularProgress />}>
                <Analytics />
              </React.Suspense>
            } />

            {/* Admin profile */}
            <Route path="profile" element={<AdminProfile />} />

            {/* Ride detail view */}
            <Route path="rides/:rideId" element={<RideDetailView />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;