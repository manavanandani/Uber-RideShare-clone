// src/pages/customer/BookRide.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import MapWithMarkers from '../../components/common/MapWithMarkers';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';

function BookRide() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [markers, setMarkers] = useState({
    pickup: null,
    dropoff: null
  });
  const [rideData, setRideData] = useState({
    pickup_location: {
      latitude: null,
      longitude: null
    },
    dropoff_location: {
      latitude: null,
      longitude: null
    },
    date_time: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    passenger_count: 1
  });
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkers(prev => ({
            ...prev,
            pickup: currentLocation
          }));
          setRideData(prev => ({
            ...prev,
            pickup_location: {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng
            }
          }));
        },
        () => {
          setError('Error: Unable to get your current location');
        }
      );
    }
  }, []);
  
  // Fetch nearby drivers when pickup is set
  useEffect(() => {
    const fetchNearbyDrivers = async () => {
      if (rideData.pickup_location.latitude && rideData.pickup_location.longitude) {
        try {
          setLoading(true);
          const response = await customerService.getNearbyDrivers(
            rideData.pickup_location.latitude,
            rideData.pickup_location.longitude
          );
          setNearbyDrivers(response.data);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch nearby drivers');
          setLoading(false);
        }
      }
    };
    
    if (activeStep === 1) {
      fetchNearbyDrivers();
    }
  }, [activeStep, rideData.pickup_location]);
  
  // Calculate fare when both pickup and dropoff are set
  useEffect(() => {
    const calculateFare = async () => {
      if (rideData.pickup_location.latitude && rideData.dropoff_location.latitude) {
        try {
          setLoading(true);
          const response = await customerService.getFareEstimate({
            pickup_latitude: rideData.pickup_location.latitude,
            pickup_longitude: rideData.pickup_location.longitude,
            dropoff_latitude: rideData.dropoff_location.latitude,
            dropoff_longitude: rideData.dropoff_location.longitude,
            datetime: rideData.date_time,
            passenger_count: rideData.passenger_count
          });
          setFareEstimate(response.data);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to calculate fare');
          setLoading(false);
        }
      }
    };

    if (markers.pickup && markers.dropoff) {
      calculateFare();
    }
  }, [markers]);
  
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    if (!markers.pickup) {
      setMarkers(prev => ({
        ...prev,
        pickup: { lat, lng }
      }));
      setRideData(prev => ({
        ...prev,
        pickup_location: { latitude: lat, longitude: lng }
      }));
    } else if (!markers.dropoff) {
      setMarkers(prev => ({
        ...prev,
        dropoff: { lat, lng }
      }));
      setRideData(prev => ({
        ...prev,
        dropoff_location: { latitude: lat, longitude: lng }
      }));
    }
  }, [markers]);
  
  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };
  
  const handleRideDataChange = (e) => {
    const { name, value } = e.target;
    setRideData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleBookRide = async () => {
    try {
      setLoading(true);
      // Add selected driver to ride data
      const bookingData = {
        ...rideData,
        driver_id: selectedDriver.driver_id
      };
      
      const response = await customerService.bookRide(bookingData);
      setLoading(false);
      
      // Navigate to ride tracking page
      navigate(`/customer/ride/${response.data.ride_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book ride');
      setLoading(false);
    }
  };
  
  const resetLocationMarker = (type) => {
    if (type === 'pickup') {
      setMarkers(prev => ({
        ...prev,
        pickup: null
      }));
      setRideData(prev => ({
        ...prev,
        pickup_location: { latitude: null, longitude: null }
      }));
    } else {
      setMarkers(prev => ({
        ...prev,
        dropoff: null
      }));
      setRideData(prev => ({
        ...prev,
        dropoff_location: { latitude: null, longitude: null }
      }));
    }
  };
  
  const steps = ['Set Locations', 'Select Driver', 'Confirm Booking'];
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                Click on the map to set pickup and drop-off locations, or enter addresses below.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pickup Location"
                value={markers.pickup ? `${markers.pickup.lat.toFixed(6)}, ${markers.pickup.lng.toFixed(6)}` : ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: markers.pickup && (
                    <Button size="small" onClick={() => resetLocationMarker('pickup')}>
                      Clear
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Drop-off Location"
                value={markers.dropoff ? `${markers.dropoff.lat.toFixed(6)}, ${markers.dropoff.lng.toFixed(6)}` : ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: markers.dropoff && (
                    <Button size="small" onClick={() => resetLocationMarker('dropoff')}>
                      Clear
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date & Time"
                type="datetime-local"
                name="date_time"
                value={rideData.date_time}
                onChange={handleRideDataChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Passengers</InputLabel>
                <Select
                  name="passenger_count"
                  value={rideData.passenger_count}
                  onChange={handleRideDataChange}
                  label="Passengers"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Available Drivers Nearby
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              ) : nearbyDrivers.length === 0 ? (
                <Alert severity="info">No drivers available in your area at the moment.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {nearbyDrivers.map(driver => (
                    <Grid item xs={12} sm={6} key={driver.driver_id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedDriver?.driver_id === driver.driver_id ? '2px solid #1976d2' : 'none',
                          bgcolor: selectedDriver?.driver_id === driver.driver_id ? 'action.selected' : 'background.paper'
                        }}
                        onClick={() => handleDriverSelect(driver)}
                      >
                        <CardContent>
                          <Typography variant="h6">{`${driver.first_name} ${driver.last_name}`}</Typography>
                          <Typography variant="body2" color="textSecondary">{driver.car_details}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Rating:</Typography>
                            <Typography variant="body1">{driver.rating?.toFixed(1) || "N/A"}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Ride Summary
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1">Pickup Location</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {`${rideData.pickup_location.latitude.toFixed(6)}, ${rideData.pickup_location.longitude.toFixed(6)}`}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Drop-off Location</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {`${rideData.dropoff_location.latitude.toFixed(6)}, ${rideData.dropoff_location.longitude.toFixed(6)}`}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Date & Time</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {new Date(rideData.date_time).toLocaleString()}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Passengers</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {rideData.passenger_count}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1">Driver</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name} (${selectedDriver.car_details})` : 'No driver selected'}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Fare Estimate</Typography>
                  {fareEstimate ? (
                    <Box>
                      <Typography variant="h5" color="primary">
                        ${fareEstimate.data.fare.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Distance: {fareEstimate.data.distance.toFixed(2)} km
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Duration: {fareEstimate.data.duration.toFixed(0)} mins
                      </Typography>
                      {fareEstimate.data.demandSurge > 1 && (
                        <Typography variant="body2" color="error">
                          Surge pricing: {fareEstimate.data.demandSurge.toFixed(1)}x
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Calculating...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book a Ride
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <MapWithMarkers
            pickup={markers.pickup}
            dropoff={markers.dropoff}
            showDirections={markers.pickup && markers.dropoff}
            onMapClick={activeStep === 0 ? handleMapClick : undefined}
            height={400}
          />
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {renderStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              onClick={handleBack} 
              disabled={activeStep === 0 || loading}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBookRide}
                  disabled={loading || !selectedDriver || !fareEstimate}
                >
                  {loading ? <CircularProgress size={24} /> : 'Book Ride'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={
                    loading || 
                    (activeStep === 0 && (!markers.pickup || !markers.dropoff)) ||
                    (activeStep === 1 && !selectedDriver)
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default BookRide;