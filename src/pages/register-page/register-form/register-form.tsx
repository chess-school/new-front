import React from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import './styles.scss';
import { registerUser } from '@/api/register/register';
import { loginValidation, passwordValidation, nameValidation } from '@/shared/validation/validation';
import { useTranslation } from 'react-i18next';
import { AuthFormHeader } from '@/shared/components/AuthFormHeader/AuthFormHeader';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values: any) => {
    try {
      const response = await registerUser(values);
      navigate(`/verify-email?token=${response.token}`, {
        state: {
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
        },
      });
    } catch {
      notification.error({
        message: t('register.error.title'),
        description: t('register.error.description'),
      });
    }
  };

   return (
    <div className="register-form">
      <AuthFormHeader title={t('register.title')} />
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        className="register-form__form"
        size="large"
      >
        <Form.Item label={<span className="register-form__label">{t('register.name')}</span>} name="firstName" rules={nameValidation}>
          <Input placeholder={t('register.placeholder.name')} />
        </Form.Item>

        <Form.Item label={<span className="register-form__label">{t('register.lastName')}</span>} name="lastName" rules={nameValidation}>
          <Input placeholder={t('register.placeholder.lastName')} />
        </Form.Item>

        <Form.Item label={<span className="register-form__label">{t('register.email')}</span>} name="email" rules={loginValidation}>
          <Input placeholder={t('register.placeholder.email')} />
        </Form.Item>

        <Form.Item label={<span className="register-form__label">{t('register.password')}</span>} name="password" rules={passwordValidation}>
          <Input.Password placeholder={t('register.placeholder.password')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="register-form__button" block>
            {t('register.submit')}
          </Button>
        </Form.Item>
      </Form>

      <div className="register-form__footer register-form__label">
        {t('register.haveAccount')}{' '}
        <a className="register-form__signup-link" onClick={() => navigate('/login')}>
          {t('register.login')}
        </a>
      </div>
    </div>
  );
};
