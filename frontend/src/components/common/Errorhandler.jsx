// src/components/common/ErrorHandler.jsx
import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

function ErrorHandler({ error, clearError }) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (error) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [error]);
  
  const handleClose = () => {
    setOpen(false);
    if (clearError) {
      clearError();
    }
  };
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {error}
      </Alert>
    </Snackbar>
  );
}

export default ErrorHandler;