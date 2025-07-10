import React from 'react';
import Form, { FormProps } from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { AuthFormHeader } from '@/shared/components/AuthFormHeader/AuthFormHeader';

import { loginUser } from '@/api/login';

import { LoginCredentials } from '@/types/Auth'; 

import PageTitle from '@/shared/components/PageTitle';
import './style.scss';

export const AuthForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onFinish: FormProps<LoginCredentials>['onFinish'] = async (values) => {
    try {
      const { token, user } = await loginUser(values);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/profile', { replace: true }); 
      
      notification.success({
        message: t('auth.success.login_title'),
        description: t('auth.success.welcome_back', { name: user.firstName }),
      });

    } catch (error) {
      console.error('Login failed on component level:', error);
      notification.error({
        message: t('auth.errors.login'),
        description: t('auth.errors.invalid_credentials'),
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
        <PageTitle text={t('auth.welcome')} />

        <AuthFormHeader title={t('auth.sign_in')} />
        
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form__form"
          size="large"
          autoComplete="off" 
        >
          <Form.Item
            label={<span className="auth-form__label">{t('auth.email')}</span>}
            name="email"
            rules={[
              { required: true, message: t('auth.errors.required') },
              { type: 'email', message: t('auth.errors.invalid_email') },
            ]}
          >
            <Input placeholder={t('auth.email_placeholder')} />
          </Form.Item>

          <Form.Item
            label={<span className="auth-form__label">{t('auth.password')}</span>}
            name="password"
            rules={[
              { required: true, message: t('auth.errors.required') },
              { min: 6, message: t('auth.errors.password_length') },
            ]}
          >
            <Input.Password placeholder={t('auth.password_placeholder')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-form__button" block>
              {t('auth.sign_in')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-form__footer auth-form__label">
          {t('auth.no_account')}{' '}
          <a className="auth-form__signup-link" onClick={() => navigate('/register')}>
            {t('auth.sign_up')}
          </a>
        </div>
      </div>
    </div>
  );
};