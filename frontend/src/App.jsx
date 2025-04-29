// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import theme
import theme from './theme';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import BookRide from './pages/customer/BookRide';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import AvailableRides from './pages/driver/AvailableRides';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';

// Create placeholder components for missing pages
const RideTracking = () => <div>Ride Tracking Page (Placeholder)</div>;
const CustomerProfile = () => <div>Customer Profile Page (Placeholder)</div>;
const DriverProfile = () => <div>Driver Profile Page (Placeholder)</div>;
const UserManagement = () => <div>User Management Page (Placeholder)</div>;
const Analytics = () => <div>Analytics Page (Placeholder)</div>;

// Create placeholder layouts
const DriverLayout = ({ children }) => (
  <div>
    <h1>Driver Layout</h1>
    <div>{children}</div>
  </div>
);

const AdminLayout = ({ children }) => (
  <div>
    <h1>Admin Layout</h1>
    <div>{children}</div>
  </div>
);

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Protected route component
  const ProtectedRoute = ({ children, roles }) => {
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
          <Route path="/customer" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CustomerDashboard />} />
            <Route path="book" element={<BookRide />} />
            <Route path="ride/:rideId" element={<RideTracking />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
          
          {/* Driver routes */}
          <Route path="/driver" element={
            <ProtectedRoute roles={['driver']}>
              <DriverLayout>
                <Routes>
                  <Route index element={<DriverDashboard />} />
                  <Route path="rides" element={<AvailableRides />} />
                  <Route path="profile" element={<DriverProfile />} />
                </Routes>
              </DriverLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="analytics" element={<Analytics />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />
          
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