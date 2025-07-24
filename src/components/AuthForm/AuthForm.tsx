import React, { useContext } from 'react';
import Form, { FormProps } from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import Typography from 'antd/es/typography';
import { FaChessKing } from 'react-icons/fa';

import { loginUser } from '@/api/login';
import { registerUser } from '@/api/register/register';
import { LoginCredentials, RegistrationData } from '@/types/Auth';
import { loginValidation, passwordValidation, nameValidation } from '@/shared/validation';

import './styles.scss';
import { AuthContext } from '@/context/AuthContext';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthForm must be used within an AuthProvider");
  }
  const { login: authLogin } = auth;

  const isLoginMode = mode === 'login';

  const handleLogin: FormProps<LoginCredentials>['onFinish'] = async (values) => {
    try {
      const { token, user } = await loginUser(values);
      
      authLogin(token, user);
      
      navigate(`/profile/${user._id}`, { replace: true }); 
      // navigate(`/profile`, { replace: true }); 

      notification.success({
        message: t('auth.success.login_title'),
        description: t('auth.success.welcome_back', { name: user.firstName }),
      });
    } catch (error) {
      notification.error({
        message: t('auth.errors.login'),
        description: (error as any).response?.data?.msg || t('auth.errors.invalid_credentials'),
      });
    }
  };

  const handleRegister: FormProps<RegistrationData>['onFinish'] = async (values) => {
    try {
      const response = await registerUser(values);
      const registeredEmail = response.email;

      navigate('/verify-email', {
        replace: true, 
        state: {
          email: registeredEmail,
          firstName: values.firstName,
          lastName: values.lastName,
        },
      });

      notification.success({
        message: t('register.success.title'),
        description: t('register.success.description'),
      });

    } catch (error) {
      notification.error({
        message: t('register.error.title'),
        description: (error as any).response?.data?.msg || t('register.error.description'),
      });
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header" onClick={() => navigate('/')}>
        <FaChessKing className="auth-header__icon" />
        <Typography.Title level={4} className="auth-header__brand">
          {t('common.brand')} 
        </Typography.Title>
      </div>
      <Typography.Title level={3} className="auth-header__title">
        {isLoginMode ? t('auth.sign_in') : t('register.title')}
      </Typography.Title>
      
      <Form
        name={mode}
        onFinish={isLoginMode ? handleLogin : handleRegister}
        layout="vertical"
        className="auth-form-body"
        size="large"
        autoComplete="off"
      >
        {!isLoginMode && (
          <>
            <Form.Item label={<span className="auth-form-label">{t('register.name')}</span>} name="firstName" rules={nameValidation(t)}>
              <Input placeholder={t('register.placeholder.name')} />
            </Form.Item>
            <Form.Item label={<span className="auth-form-label">{t('register.lastName')}</span>} name="lastName" rules={nameValidation(t)}>
              <Input placeholder={t('register.placeholder.lastName')} />
            </Form.Item>
          </>
        )}

        <Form.Item label={<span className="auth-form-label">{t('common.email')}</span>} name="email" rules={loginValidation(t)}>
          <Input placeholder={t('common.placeholder.email')} />
        </Form.Item>

        <Form.Item label={<span className="auth-form-label">{t('common.password')}</span>} name="password" rules={passwordValidation(t)}>
          <Input.Password placeholder={t('common.placeholder.password')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="auth-form-button" block>
            {isLoginMode ? t('auth.sign_in') : t('register.submit')}
          </Button>
        </Form.Item>
      </Form>
      
      <div className="auth-form-footer">
        {isLoginMode ? (
          <>
            {t('auth.no_account')}{' '}
            <a className="auth-form-link" onClick={() => navigate('/register')}>
              {t('auth.sign_up')}
            </a>
          </>
        ) : (
          <>
            {t('register.haveAccount')}{' '}
            <a className="auth-form-link" onClick={() => navigate('/login')}>
              {t('register.login')}
            </a>
          </>
        )}
      </div>
    </div>
  );
};