import React from 'react';
import Typography from 'antd/es/typography';
import { FaChessKing } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './styles.scss';

interface AuthFormHeaderProps {
  title: string;
}

export const AuthFormHeader: React.FC<AuthFormHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <div className="auth-header__logo" onClick={() => navigate('/')}>
        <FaChessKing className="auth-header__icon" />
        <Typography.Title level={4} className="auth-header__brand">
          {t('common.brand')} 
        </Typography.Title>
      </div>

      <Typography.Title level={3} className="auth-header__title">
        {title}
      </Typography.Title>
    </>
  );
};