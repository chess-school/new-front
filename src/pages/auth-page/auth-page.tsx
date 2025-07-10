import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import './styles.scss';

export const AuthPage: React.FC = () => {
  const location = useLocation();

  const mode = location.pathname.includes('register') ? 'register' : 'login';

  return (
    <div className="auth-page-wrapper">
      <AuthForm mode={mode} />
    </div>
  );
};