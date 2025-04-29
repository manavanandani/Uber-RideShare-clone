// src/components/common/MapWithMarkers.jsx
import { Box, Typography, Paper } from '@mui/material';

// This is a simplified placeholder version of the MapWithMarkers component
// It doesn't actually load Google Maps or display real maps
function MapWithMarkers({ pickup, dropoff, showDirections, height = 400 }) {
  return (
    <Paper sx={{ 
      height, 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      bgcolor: '#f0f0f0',
      overflow: 'hidden'
    }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Map Placeholder (Google Maps API key required)
      </Typography>
      
      {pickup && (
        <Box sx={{ 
          position: 'absolute', 
          top: '30%', 
          left: '30%', 
          bgcolor: 'primary.main',
          color: 'white',
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}>
          P
        </Box>
      )}
      
      {dropoff && (
        <Box sx={{ 
          position: 'absolute', 
          top: '60%', 
          left: '60%', 
          bgcolor: 'secondary.main',
          color: 'white',
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}>
          D
        </Box>
      )}
      
      {pickup && dropoff && showDirections && (
        <Box sx={{
          position: 'absolute',
          top: '35%',
          left: '32%',
          width: '30%',
          height: '2px',
          bgcolor: 'primary.main',
          transform: 'rotate(45deg)',
          transformOrigin: '0 0',
          zIndex: 1
        }} />
      )}
      
      {pickup && (
        <Box sx={{ position: 'absolute', bottom: 20, left: 20 }}>
          <Typography variant="caption">
            Pickup: {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
          </Typography>
        </Box>
      )}
      
      {dropoff && (
        <Box sx={{ position: 'absolute', bottom: 20, right: 20 }}>
          <Typography variant="caption">
            Dropoff: {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default MapWithMarkers;