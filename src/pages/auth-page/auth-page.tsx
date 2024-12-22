import React from 'react';
import { AuthForm } from './auth-form';
import './auth-page.css';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

export const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="auth-page">
             <Button 
        variant="text" 
        onClick={() => navigate('/')} 
        sx={{ position: 'absolute', top: 16, left: 16 }}
      >
        Назад
      </Button>
            <AuthForm />
        </div>
    )
}
