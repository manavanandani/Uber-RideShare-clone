// Updated App.jsx with admin routes
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getCurrentUser } from './store/slices/authSlice';

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
import CustomersManagement from './pages/admin/CustomersManagment';
import RidesManagement from './pages/admin/RidesManagment';
import BillingManagement from './pages/admin/BillingManagment';
import Analytics from './pages/admin/Analytics';
import AddDriver from './pages/admin/AddDriver';
import AddCustomer from './pages/admin/AddCustomer';
import BillingDetail from './pages/admin/BillingDetail';

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Protected route component
  const ProtectedRoute = ({ children, roles }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (roles && !roles.includes(user?.role)) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'customer') {
        return <Navigate to="/customer" />;
      } else if (user?.role === 'driver') {
        return <Navigate to="/driver" />;
      } else if (user?.role === 'admin') {
        return <Navigate to="/admin" />;
      } else {
        return <Navigate to="/" />;
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/driver-application" element={<DriverApplication />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
          
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
            <Route path="drivers/:driverId" element={<DriverProfile />} />
            
            {/* Customer management */}
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="customers/add" element={<AddCustomer />} />
            <Route path="customers/:customerId" element={<CustomerProfile />} />
            
            {/* Ride management */}
            <Route path="rides" element={<RidesManagement />} />
            <Route path="rides/:rideId" element={<RideDetail />} />
            
            {/* Billing management */}
            <Route path="billing" element={<BillingManagement />} />
            <Route path="billing/:billId" element={<BillingDetail />} />
            
            {/* Analytics */}
            <Route path="analytics" element={<Analytics />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;