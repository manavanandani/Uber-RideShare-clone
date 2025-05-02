// src/components/common/MapWithMarkers.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

function MapWithMarkers({
  pickup = null,
  dropoff = null,
  showDirections = true,
  height = 400,
  onMapClick = null,
  markers = []
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const additionalMarkersRef = useRef([]);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      // Add click handler if provided
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          onMapClick({
            latLng: {
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }
          });
        });
      }
    }
    
    // Clean up when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle pickup marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Remove existing marker if it exists
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    
    // Add new marker if pickup coordinates exist
    if (pickup) {
      const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: greenIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Pickup Location');
      
      // Center map on pickup if it's the only marker
      if (!dropoff) {
        mapInstanceRef.current.setView([pickup.lat, pickup.lng], 13);
      }
    }
  }, [pickup]);

  // Handle dropoff marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Remove existing marker if it exists
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }
    
    // Add new marker if dropoff coordinates exist
    if (dropoff) {
      const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      dropoffMarkerRef.current = L.marker([dropoff.lat, dropoff.lng], { icon: redIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Dropoff Location');
    }
  }, [dropoff]);

  // Handle route drawing
  useEffect(() => {
    if (!mapInstanceRef.current || !pickup || !dropoff || !showDirections) return;
    
    // Remove existing route if it exists
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    
    // Draw a simple straight line for the route
    routeLayerRef.current = L.polyline(
      [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
      { color: '#1976d2', weight: 5 }
    ).addTo(mapInstanceRef.current);
    
    // Fit map bounds to show both markers
    const bounds = L.latLngBounds([
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng]
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, dropoff, showDirections]);

  // Handle additional markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Remove existing markers
    additionalMarkersRef.current.forEach(marker => marker.remove());
    additionalMarkersRef.current = [];
    
    // Add new markers
    markers.forEach(marker => {
      const newMarker = L.marker([marker.position.lat, marker.position.lng])
        .addTo(mapInstanceRef.current);
      
      if (marker.title) {
        newMarker.bindPopup(marker.title);
      }
      
      additionalMarkersRef.current.push(newMarker);
    });
  }, [markers]);

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </Box>
  );
}

export default MapWithMarkers;