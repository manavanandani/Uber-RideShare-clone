// src/components/common/UserAvatar.jsx
import React from 'react';
import { Avatar, Box } from '@mui/material';

function UserAvatar({ user, size = 'medium', showStatus = false }) {
  // Get initials from user's name
  const getInitials = () => {
    if (!user) return '?';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    } else if (user.first_name) {
      return user.first_name[0];
    } else if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`;
      }
      return user.name[0];
    }
    
    // Fallback based on role
    return user.role === 'driver' ? 'D' : user.role === 'customer' ? 'C' : 'U';
  };
  
  // Get size based on prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 64, height: 64 };
      case 'extra-large':
        return { width: 80, height: 80 };
      default: // medium
        return { width: 40, height: 40 };
    }
  };
  
  // Get color based on user role
  const getColor = () => {
    if (!user) return 'grey.500';
    
    switch (user.role) {
      case 'driver':
        return 'primary.main';
      case 'customer':
        return 'secondary.main';
      case 'admin':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Avatar 
        sx={{ ...getSize(), bgcolor: getColor() }}
        alt={user?.first_name || 'User'}
        src={user?.profile_image || ''}
      >
        {getInitials()}
      </Avatar>
      
      {showStatus && user?.status && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: user.status === 'available' ? 'success.main' : 
                    user.status === 'busy' ? 'warning.main' : 'grey.500',
            border: '1.5px solid white'
          }}
        />
      )}
    </Box>
  );
}

export default UserAvatar;