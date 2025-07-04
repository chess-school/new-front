import React from 'react';
import { RegisterForm } from './register-form';
import './styles.scss';

export const RegisterPage: React.FC = () => {


  return (
    <div className="register-page">
       {/* <Button 
        variant="text" 
        onClick={() => navigate('/')} 
        sx={{ position: 'absolute', top: 16, left: 16 }}
      >
        Назад
      </Button> */}

      <RegisterForm />
    </div>
  );
};

export * from './register-page';
