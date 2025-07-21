import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthContext } from '@/context/AuthContext';

const GuestRoute: React.FC = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("GuestRoute must be used within an AuthProvider");
  }

  const { isAuthenticated, loading } = auth;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;