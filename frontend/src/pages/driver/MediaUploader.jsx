// src/components/driver/MediaUploader.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardMedia,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { driverService } from '../../services/driverService';

function MediaUploader({ onUploadComplete }) {
  const { user } = useSelector(state => state.auth);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file type (image or video)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select an image or video file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      setError(null);
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await driverService.uploadMedia(user.driver_id, selectedFile);
      
      setSuccess('Media uploaded successfully');
      setSelectedFile(null);
      setPreview(null);
      
      // Inform parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Media
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {!preview ? (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 1,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                bgcolor: 'background.paper',
                cursor: 'pointer'
              }}
              component="label"
            >
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleFileSelect}
              />
              <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" align="center">
                Click or drag file to upload<br />
                (images or videos, max 10MB)
              </Typography>
            </Box>
            ) : (
                <Box sx={{ position: 'relative' }}>
                  {selectedFile.type.startsWith('image/') ? (
                    <Card>
                      <CardMedia
                        component="img"
                        image={preview}
                        alt="Preview"
                        sx={{ height: 200, objectFit: 'contain' }}
                      />
                    </Card>
                  ) : (
                    <Card>
                      <CardMedia
                        component="video"
                        src={preview}
                        controls
                        sx={{ height: 200 }}
                      />
                    </Card>
                  )}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.default' }
                    }}
                    onClick={handleClearSelection}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Upload
              </Button>
            </Grid>
          </Grid>
        </Paper>
      );
    }
    
    export default MediaUploader;