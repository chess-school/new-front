import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Импортируем наш хук

// Импортируем что-нибудь для отображения загрузки
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute: React.FC = () => {
  // Получаем АКТУАЛЬНЫЕ данные из единого источника правды
  const { isAuthenticated, loading } = useAuth();
  
  // 1. Если AuthContext ЕЩЕ В ПРОЦЕССЕ ПРОВЕРКИ (например, при первой загрузке),
  // мы не принимаем никаких решений, а просто показываем лоадер.
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Если проверка ЗАВЕРШЕНА (`loading: false`) и пользователь НЕ авторизован
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Если проверка ЗАВЕРШЕНА и пользователь АВТОРИЗОВАН
  return <Outlet />; // Показываем защищенный контент (например, ProfilePage)
};

export default PrivateRoute;