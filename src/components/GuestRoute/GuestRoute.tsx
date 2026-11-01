import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthContext } from '@/context/AuthContext';

const GuestRoute: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("GuestRoute must be used within an AuthProvider");

  const { isAuthenticated, user, loading } = auth;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    // Профиль адресуется по uuid (маршрут /profile/:uuid). Раньше тут был _id → попадали на
    // «чужой профиль / not implemented». Фолбэк на лендинг, если uuid почему-то нет.
    return <Navigate to={user.uuid ? `/profile/${user.uuid}` : '/'} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;