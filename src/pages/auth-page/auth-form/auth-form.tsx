import React from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useForm, SubmitHandler, Controller, useFormState } from "react-hook-form";
import axios from 'axios';
import { notification } from 'antd';
import { FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './style.scss';
import { loginValidation, passwordValidation } from './validation';
import { useNavigate } from 'react-router-dom';

interface ISignInForm {
  email: string;
  password: string;
}

export const AuthForm: React.FC = () => {
  const { handleSubmit, control } = useForm<ISignInForm>();
  const { errors } = useFormState({ control });
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Основной вход через email и пароль
  const onSubmit: SubmitHandler<ISignInForm> = async (data) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: data.email,
        password: data.password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/profile', { state: user });

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else {
        console.error('Error:', error);
      }
      notification.error({
        message: t('errors.login'),
        description: undefined
      });
    }
  };

  // Вход через Google
  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  // Вход через Facebook
  const handleFacebookSignIn = () => {
    window.location.href = 'http://localhost:3000/api/auth/facebook';
  };

  // Вход через Apple
  const handleAppleSignIn = () => {
    window.location.href = 'http://localhost:3000/api/auth/apple';
  };

  return (
    <div className="auth-form">
  <Typography variant="h4" component="div" className="auth-form__title">
    Welcome Back!
  </Typography>
  <Typography variant="subtitle1" component="div" className="auth-form__subtitle">
    Enter your credentials to access your account
  </Typography>
  <form className="auth-form__form" onSubmit={handleSubmit(onSubmit)}>
    <Controller
      control={control}
      name="email"
      rules={loginValidation}
      render={({ field }) => (
        <TextField
          label="Email"
          onChange={(e) => field.onChange(e)}
          value={field.value}
          fullWidth
          size="small"
          margin="normal"
          className="auth-form__input"
          error={!!errors.email?.message}
          helperText={errors?.email?.message}
        />
      )}
    />
    <Controller
      control={control}
      name="password"
      rules={passwordValidation}
      render={({ field }) => (
        <TextField
          label="Password"
          type="password"
          onChange={(e) => field.onChange(e)}
          value={field.value}
          fullWidth
          size="small"
          margin="normal"
          className="auth-form__input"
          error={!!errors.password?.message}
          helperText={errors?.password?.message}
        />
      )}
    />
    <Button
      type="submit"
      variant="contained"
      fullWidth
      className="auth-form__button"
    >
      Sign In
    </Button>
  </form>

  <div className="auth-form__divider"></div>

  <Typography variant="subtitle1" component="div" style={{ marginBottom: '10px' }}>
    Or sign in with
  </Typography>
  <div className="auth-form__social-login">
        <div className="auth-form__social-icon cursor-pointer" onClick={handleGoogleSignIn}>
          <FaGoogle size={20} color="#DB4437" />
        </div>
        <div className="auth-form__social-icon cursor-pointer" onClick={handleFacebookSignIn}>
          <FaFacebookF size={20} color="#4267B2" />
        </div>
        <div className="auth-form__social-icon cursor-pointer" onClick={handleAppleSignIn}>
          <FaApple size={20} color="#000000" />
        </div>
      </div>
  <div className="auth-form__footer">
    Don’t have an account? <a onClick={() => navigate('/register')}>Sign up</a>
  </div>
</div>

  );
};
