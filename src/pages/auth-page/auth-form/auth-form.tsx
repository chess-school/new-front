import React from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { FaChessKing } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notification } from 'antd';
import PageTitle from '@/shared/components/PageTitle';
import './style.scss';

export const AuthForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', values);

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/profile', { state: user });
    } catch (error) {
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

        <div className="auth-form__logo" onClick={() => navigate('/')}>
          <FaChessKing className="auth-form__icon" />
          <Typography.Title level={4} className="auth-form__brand">
            MOB - Mind Over Board
          </Typography.Title>
        </div>

        <Typography.Text className="auth-form__subtitle">
          {t('auth.enter_credentials')}
        </Typography.Text>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form__form"
          size="large"
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
