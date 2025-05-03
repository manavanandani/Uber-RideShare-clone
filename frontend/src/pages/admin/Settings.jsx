// src/pages/admin/Settings.jsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
//import api from '../../services/api';

function Settings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  
  // Pricing settings
  const [pricingSettings, setPricingSettings] = useState({
    baseFare: 3.0,
    costPerKm: 1.5,
    costPerMinute: 0.2,
    surgeMultiplierMax: 3.0,
    waitingTimeCost: 0.1
  });
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    enableCaching: true,
    cacheDuration: 300,
    enableKafka: true,
    enableLogging: true,
    maxSearchRadius: 10
  });
  
  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingSettings(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };
  
  const handleSystemChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, you would save these settings to your backend
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully');
      setSaving(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
      setSaving(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pricing Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Base Fare ($)"
                  name="baseFare"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={pricingSettings.baseFare}
                  onChange={handlePricingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cost per Kilometer ($)"
                  name="costPerKm"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={pricingSettings.costPerKm}
                  onChange={handlePricingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cost per Minute ($)"
                  name="costPerMinute"
                  type="number"
                  inputProps={{ step: 0.01 }}
                  value={pricingSettings.costPerMinute}
                  onChange={handlePricingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Maximum Surge Multiplier"
                  name="surgeMultiplierMax"
                  type="number"
                  inputProps={{ step: 0.1, min: 1.0, max: 5.0 }}
                  value={pricingSettings.surgeMultiplierMax}
                  onChange={handlePricingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Waiting Time Cost per Minute ($)"
                  name="waitingTimeCost"
                  type="number"
                  inputProps={{ step: 0.01 }}
                  value={pricingSettings.waitingTimeCost}
                  onChange={handlePricingChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.enableCaching}
                      onChange={handleSystemChange}
                      name="enableCaching"
                    />
                  }
                  label="Enable Redis Caching"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cache Duration (seconds)"
                  name="cacheDuration"
                  type="number"
                  value={systemSettings.cacheDuration}
                  onChange={handleSystemChange}
                  disabled={!systemSettings.enableCaching}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.enableKafka}
                      onChange={handleSystemChange}
                      name="enableKafka"
                    />
                  }
                  label="Enable Kafka Messaging"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.enableLogging}
                      onChange={handleSystemChange}
                      name="enableLogging"
                    />
                  }
                  label="Enable Detailed Logging"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Maximum Search Radius (km)"
                  name="maxSearchRadius"
                  type="number"
                  inputProps={{ min: 1, max: 50 }}
                  value={systemSettings.maxSearchRadius}
                  onChange={handleSystemChange}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                >
                  Clear Redis Cache
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                >
                  Refresh Kafka Topics
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                >
                  Restart Services
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}

export default Settings;