// src/components/common/MapWithMarkers.jsx
import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749, // San Francisco default
  lng: -122.4194
};

function MapWithMarkers({ 
  pickup, 
  dropoff, 
  center = defaultCenter,
  showDirections = true,
  clickable = false,
  onMapClick = () => {},
  height = 400
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your API key
    libraries: ['places']
  });
  
  const [directions, setDirections] = useState(null);
  
  useEffect(() => {
    if (isLoaded && pickup && dropoff && showDirections) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: pickup,
          destination: dropoff,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    }
  }, [isLoaded, pickup, dropoff, showDirections]);
  
  if (loadError) {
    return <Typography color="error">Error loading maps</Typography>;
  }
  
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const mapCenter = pickup || center;
  
  return (
    <GoogleMap
      mapContainerStyle={{ ...mapContainerStyle, height }}
      center={mapCenter}
      zoom={12}
      onClick={clickable ? onMapClick : undefined}
    >
      {pickup && (
        <Marker
          position={pickup}
          label="P"
        />
      )}
      {dropoff && (
        <Marker
          position={dropoff}
          label="D"
        />
      )}
      {directions && showDirections && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#1976d2',
              strokeWeight: 5
            }
          }}
        />
      )}
    </GoogleMap>
  );
}

export default MapWithMarkers;