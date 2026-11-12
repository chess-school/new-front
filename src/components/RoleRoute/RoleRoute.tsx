import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/components/AppShell/ViewContext';
import { User } from '@/types/User';

type Role = User['roles'][number];

interface RoleRouteProps {
  roles?: Role[];
}

// Пускает только пользователей хотя бы с одной из ролей; остальных отправляет на главную
const RoleRoute: React.FC<RoleRouteProps> = ({ roles = ['COACH', 'ADMIN'] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { canViewCoach, canViewAdmin } = useView();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.roles?.some((role) => roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  // Предпросмотр «как роль» / режим Learn: права реальные, но тренерский/админский экран под
  // «Viewing as student» показывать нельзя — уводим в ученический раздел. Выход — через селектор роли/режима.
  const adminOnly = roles.length === 1 && roles[0] === 'ADMIN';
  if (adminOnly ? !canViewAdmin : !canViewCoach) {
    return <Navigate to="/puzzles" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
