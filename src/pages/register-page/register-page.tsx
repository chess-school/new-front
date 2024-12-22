import React from 'react';
import { RegisterForm } from './register-form';
import './register-page.css';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

export const RegisterPage: React.FC = () => {

  const navigate = useNavigate();

  return (
    <div className="register-page">
       <Button 
        variant="text" 
        onClick={() => navigate('/')} 
        sx={{ position: 'absolute', top: 16, left: 16 }}
      >
        Назад
      </Button>

      <RegisterForm />
    </div>
  );
};

export * from './register-page';
