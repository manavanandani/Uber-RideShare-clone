// src/pages/customer/BookRide.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import MapWithMarkers from '../../components/common/MapWithMarkers';
import axios from 'axios';
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
    date_time: new Date().toISOString().slice(0, 16),
    passenger_count: 1,
    customer_id: null // Will be set after user is loaded
  });
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  
  // New state for address inputs
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  
  // Set customer_id from user when component mounts or user changes
  useEffect(() => {
    if (user && user.customer_id) {
      setRideData(prev => ({
        ...prev,
        customer_id: user.customer_id
      }));
    }
  }, [user]);
  
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
          
          // Reverse geocode the current location for better UX
          reverseGeocode(currentLocation.lat, currentLocation.lng)
            .then(address => {
              if (address) {
                setPickupAddress(address);
              }
            })
            .catch(err => console.error('Error reverse geocoding:', err));
        },
        () => {
          setError('Error: Unable to get your current location');
        }
      );
    }
  }, []);
  
  // Calculate fare when both pickup and dropoff are set
  useEffect(() => {
    const calculateFare = async () => {
      if (rideData.pickup_location.latitude && rideData.dropoff_location.latitude) {
        try {
          setLoading(true);
          
          console.log('Starting fare calculation with data:', {
            pickup: rideData.pickup_location,
            dropoff: rideData.dropoff_location,
            datetime: rideData.date_time,
            passengers: rideData.passenger_count
          });
          
          // Set a timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fare calculation timeout')), 5000)
          );
          
          // Race the API call with a timeout
          const response = await Promise.race([
            customerService.getFareEstimate({
              pickup_latitude: rideData.pickup_location.latitude,
              pickup_longitude: rideData.pickup_location.longitude,
              dropoff_latitude: rideData.dropoff_location.latitude,
              dropoff_longitude: rideData.dropoff_location.longitude,
              datetime: rideData.date_time,
              passenger_count: rideData.passenger_count
            }),
            timeoutPromise
          ]);
          
          console.log('Fare estimate response:', response);
          setFareEstimate(response);
          setLoading(false);
        } catch (err) {
          console.error('Fare calculation error:', err);
          
          // Fallback fare calculation on frontend
          const directDistance = calculateDirectDistance(
            rideData.pickup_location.latitude,
            rideData.pickup_location.longitude,
            rideData.dropoff_location.latitude,
            rideData.dropoff_location.longitude
          );
          
          // Simple fare calculation - should match backend's emergency fallback
          const baseFare = 3.0;
          const distanceFare = directDistance * 1.5;
          const duration = directDistance * 2; // Rough estimate: 2 minutes per km
          const timeFare = duration * 0.2;
          const fare = baseFare + distanceFare + timeFare;
          
          // Set a fallback fare estimate
          setFareEstimate({
            data: {
              fare: Math.round(fare * 100) / 100,
              distance: directDistance,
              duration: duration,
              demandSurge: 1.0
            }
          });
          
          setError('Could not fetch exact fare estimate. Using approximate calculation.');
          setLoading(false);
        }
      }
    };

    // Add this helper function within useEffect
    function calculateDirectDistance(lat1, lon1, lat2, lon2) {
      // Haversine formula to calculate direct distance
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    }

    if (markers.pickup && markers.dropoff) {
      calculateFare();
    }
  }, [markers, rideData.date_time, rideData.dropoff_location.latitude, rideData.dropoff_location.longitude, rideData.passenger_count, rideData.pickup_location.latitude, rideData.pickup_location.longitude]);

  // Function to geocode an address using Nominatim
  const geocodeAddress = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      // Add a delay to respect Nominatim's usage policy (no more than 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'UberSimulationApp/1.0' // Required by Nominatim's terms of use
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  };
  
  // Function for reverse geocoding (coordinates to address)
  const reverseGeocode = async (lat, lng) => {
    try {
      // Add a delay to respect Nominatim's usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'UberSimulationApp/1.0'
          }
        }
      );
      
      if (response.data && response.data.display_name) {
        return response.data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const handleMapClick = (event) => {
    // Extract lat and lng from the event
    let lat, lng;
    
    // Handle different map click event structures
    if (event.latLng && typeof event.latLng.lat === 'function') {
      // Google Maps style event
      lat = event.latLng.lat();
      lng = event.latLng.lng();
    } else if (event.latLng) {
      // Our custom leaflet wrapper
      lat = event.latLng.lat;
      lng = event.latLng.lng;
    } else if (event.latlng) {
      // Direct Leaflet event
      lat = event.latlng.lat;
      lng = event.latlng.lng;
    } else {
      console.error("Unrecognized map click event format:", event);
      return;
    }
    
    // Determine whether to set pickup or dropoff
    if (!markers.pickup) {
      // Set pickup if not already set
      setMarkers(prev => ({ 
        ...prev, 
        pickup: { lat, lng } 
      }));
      setRideData(prev => ({
        ...prev,
        pickup_location: { latitude: lat, longitude: lng }
      }));
      
      // Also update the address field with reverse geocoding
      reverseGeocode(lat, lng)
        .then(address => {
          if (address) {
            setPickupAddress(address);
          }
        })
        .catch(err => console.error('Error reverse geocoding pickup:', err));
    } else {
      // If pickup is set, set or update dropoff
      setMarkers(prev => ({ 
        ...prev, 
        dropoff: { lat, lng } 
      }));
      setRideData(prev => ({
        ...prev,
        dropoff_location: { latitude: lat, longitude: lng }
      }));
      
      // Also update the address field with reverse geocoding
      reverseGeocode(lat, lng)
        .then(address => {
          if (address) {
            setDropoffAddress(address);
          }
        })
        .catch(err => console.error('Error reverse geocoding dropoff:', err));
    }
  };
  
  // Functions for handling address input
  const handlePickupAddressChange = (e) => {
    setPickupAddress(e.target.value);
  };
  
  const handleDropoffAddressChange = (e) => {
    setDropoffAddress(e.target.value);
  };
  
  const handleGeocode = async (type) => {
    try {
      setGeocoding(true);
      setError(null);
      
      const address = type === 'pickup' ? pickupAddress : dropoffAddress;
      if (!address.trim()) {
        setError(`Please enter a ${type} address`);
        setGeocoding(false);
        return;
      }
      
      const result = await geocodeAddress(address);
      
      if (!result) {
        setError(`Could not find coordinates for the ${type} address`);
        setGeocoding(false);
        return;
      }
      
      // Update state based on whether it's pickup or dropoff
      if (type === 'pickup') {
        setMarkers(prev => ({
          ...prev,
          pickup: { lat: result.latitude, lng: result.longitude }
        }));
        setRideData(prev => ({
          ...prev,
          pickup_location: { latitude: result.latitude, longitude: result.longitude }
        }));
        
        // Update the display address if it's more detailed
        if (result.displayName && result.displayName.length > pickupAddress.length) {
          setPickupAddress(result.displayName);
        }
      } else {
        setMarkers(prev => ({
          ...prev,
          dropoff: { lat: result.latitude, lng: result.longitude }
        }));
        setRideData(prev => ({
          ...prev,
          dropoff_location: { latitude: result.latitude, longitude: result.longitude }
        }));
        
        // Update the display address if it's more detailed
        if (result.displayName && result.displayName.length > dropoffAddress.length) {
          setDropoffAddress(result.displayName);
        }
      }
      
      setGeocoding(false);
    } catch (err) {
      setError(`Failed to geocode address: ${err.message}`);
      setGeocoding(false);
    }
  };
  
  const handleRideDataChange = (e) => {
    const { name, value } = e.target;
    setRideData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNext = () => {
    // Validate data before proceeding
    if (!markers.pickup || !markers.dropoff) {
      setError('Please set both pickup and dropoff locations');
      return;
    }
    
    // Check if the user is authenticated
    if (!user || !user.customer_id) {
      setError('You must be logged in to book a ride');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    setActiveStep(1);
  };
  
  const handleBack = () => {
    setActiveStep(0);
  };
  
  const handleBookRide = async () => {
    try {
      setBooking(true);
      setError(null);
      
      // Verify user is authenticated
      if (!user || !user.customer_id) {
        setError('You must be logged in to book a ride');
        setBooking(false);
        return;
      }
      
      // Book ride without specifying a driver (system will assign one)
      const bookingData = {
        ...rideData,
        customer_id: user.customer_id // Ensure customer_id is included
      };
      
      const response = await customerService.bookRide(bookingData);
      
      // Navigate to ride tracking page
      const createdRide = response.data.data;
      setBooking(false);
      
      // Navigate to ride tracking page with the new ride ID
      navigate(`/customer/ride/${createdRide.ride_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book ride');
      setBooking(false);
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
      setPickupAddress('');
    } else {
      setMarkers(prev => ({
        ...prev,
        dropoff: null
      }));
      setRideData(prev => ({
        ...prev,
        dropoff_location: { latitude: null, longitude: null }
      }));
      setDropoffAddress('');
    }
  };
  
  // Simplified steps without driver selection
  const steps = ['Set Locations', 'Confirm Booking'];
  
  const renderStepContent = (step) => {
    if (step === 0) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
              Click on the map to set pickup and drop-off locations, or enter addresses below.
            </Typography>
          </Grid>
          
          {/* Pickup Address Input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pickup Address"
              value={pickupAddress}
              onChange={handlePickupAddressChange}
              placeholder="Enter a pickup address"
              InputProps={{
                endAdornment: (
                  <Button 
                    size="small" 
                    onClick={() => handleGeocode('pickup')}
                    disabled={geocoding || !pickupAddress}
                  >
                    {geocoding ? <CircularProgress size={20} /> : 'Search'}
                  </Button>
                )
              }}
            />
          </Grid>
          
          {/* Dropoff Address Input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Dropoff Address"
              value={dropoffAddress}
              onChange={handleDropoffAddressChange}
              placeholder="Enter a dropoff address"
              InputProps={{
                endAdornment: (
                  <Button 
                    size="small" 
                    onClick={() => handleGeocode('dropoff')}
                    disabled={geocoding || !dropoffAddress}
                  >
                    {geocoding ? <CircularProgress size={20} /> : 'Search'}
                  </Button>
                )
              }}
            />
          </Grid>
          
          {/* Coordinates Display */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pickup Coordinates"
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
              label="Drop-off Coordinates"
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
              <InputLabel id="passengers-label">Passengers</InputLabel>
              <Select
                labelId="passengers-label"
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
    } else if (step === 1) {
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
                  {pickupAddress || `${rideData.pickup_location.latitude.toFixed(6)}, ${rideData.pickup_location.longitude.toFixed(6)}`}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Drop-off Location</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {dropoffAddress || `${rideData.dropoff_location.latitude.toFixed(6)}, ${rideData.dropoff_location.longitude.toFixed(6)}`}
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
                
                <Typography variant="subtitle1">Fare Estimate</Typography>
                {loading ? (
                  <Typography variant="body1" color="textSecondary">
                    Calculating...
                  </Typography>
                ) : fareEstimate && fareEstimate.data ? (
                  <Box>
                    <Typography variant="h5" color="primary">
                      ${fareEstimate.data.fare.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Distance: {fareEstimate.data.distance.toFixed(2)} km
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Duration: {Math.round(fareEstimate.data.duration)} mins
                    </Typography>
                    {fareEstimate.data.demandSurge > 1 && (
                      <Typography variant="body2" color="error">
                        Surge pricing: {fareEstimate.data.demandSurge.toFixed(1)}x
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="error">
                    Could not calculate fare. Please try again.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    return null;
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
              disabled={activeStep === 0 || loading || booking}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBookRide}
                  disabled={loading || booking || !fareEstimate}
                >
                  {booking ? <CircularProgress size={24} /> : 'Book Ride'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={
                    loading || 
                    !markers.pickup || 
                    !markers.dropoff ||
                    !user?.customer_id
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