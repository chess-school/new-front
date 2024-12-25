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
        message: t('auth.errors.login'),
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
        {t('auth.welcome')}
      </Typography>
      <Typography variant="subtitle1" component="div" className="auth-form__subtitle">
        {t('auth.enter_credentials')}
      </Typography>
      <form className="auth-form__form" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="email"
          rules={loginValidation}
          render={({ field }) => (
            <TextField
              label={t('auth.email')}
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
              label={t('auth.password')}
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
        <div className="auth-form__options">
          <label>
            <input type="checkbox" className="auth-form__checkbox" />
            {t('auth.remember_me')}
          </label>
          <a href="/forgot-password" className="auth-form__forgot">
            {t('auth.forgot_password')}
          </a>
        </div>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          className="auth-form__button"
        >
          {t('auth.sign_in')}
        </Button>
      </form>
      <div className="auth-form__divider"></div>
      <Typography variant="subtitle1" component="div" style={{ marginBottom: '10px' }}>
        {t('auth.or_sign_in_with')}
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
        {t('auth.no_account')} <a onClick={() => navigate('/register')}>{t('auth.sign_up')}</a>
      </div>
    </div>
  );
};
