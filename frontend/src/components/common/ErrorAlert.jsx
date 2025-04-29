// src/components/common/ErrorAlert.jsx
import { Alert, Box } from '@mui/material';

function ErrorAlert({ error, sx = {} }) {
  if (!error) return null;
  
  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Alert severity="error">
        {error}
      </Alert>
    </Box>
  );
}

export default ErrorAlert;