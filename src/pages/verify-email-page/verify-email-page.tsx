import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { checkVerificationStatus, resendVerificationEmail } from '@/api/email-verify';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, lastName, email } = location.state || {};
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  const verifyToken = useCallback(async () => {
    if (!token) {
      navigate('/register');
      return;
    }
    
    setLoading(true);
    try {
      const { emailVerified } = await checkVerificationStatus(token);
      if (emailVerified) {
        setErrorMessage(t('verifyEmail.alreadyVerified'));
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setErrorMessage(t('verifyEmail.checkError'));
    } finally {
      setLoading(false);
    }
  }, [token, navigate, t]);
  
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // 4. Логика повторной отправки письма
  const handleResendEmail = async () => {
    if (!token) return;

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // 5. Используем сервисную функцию
      const response = await resendVerificationEmail(token);

      if (response.msg === 'Email is already verified.') {
        setSuccessMessage(t('verifyEmail.alreadyVerifiedSuccess'));
      } else {
        setSuccessMessage(t('verifyEmail.resendSuccess'));
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30000); // Таймер на 30 секунд
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setErrorMessage(t('verifyEmail.resendError'));
    } finally {
      setLoading(false);
    }
  };

  // Рендеринг состояния загрузки
  if (loading) {
    return (
      <Box textAlign="center" mt={5} p={2}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          {t('verifyEmail.checkingStatus')}
        </Typography>
      </Box>
    );
  }

  // Рендеринг состояния ошибки
  if (errorMessage) {
    return (
      <Box textAlign="center" mt={5} p={2}>
        <Typography variant="h6" color="error">
          {errorMessage}
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/register')} 
          sx={{ mt: 2 }}
        >
          {t('verifyEmail.backToRegister')}
        </Button>
      </Box>
    );
  }

  return (
    <Box textAlign="center" mt={5} p={2}>
      <Typography variant="h4" gutterBottom>
        {t('verifyEmail.pageTitle')}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <b>{t('verifyEmail.greeting', { firstName: firstName || '', lastName: lastName || '' })}</b>
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t('verifyEmail.sentTo', { email: email || t('verifyEmail.yourEmail') })}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: '600px', mx: 'auto' }}>
        {t('verifyEmail.instruction')}
      </Typography>

      {successMessage && (
        <Typography variant="body2" color="primary.main" sx={{ mt: 2, fontWeight: 'bold' }}>
          {successMessage}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleResendEmail}
        disabled={resendDisabled}
        sx={{ mt: 3, mb: 2 }}
      >
        {resendDisabled ? t('verifyEmail.resendButtonDisabled') : t('verifyEmail.resendButton')}
      </Button>

      <Typography variant="caption" display="block">
        {t('verifyEmail.didNotReceive')}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); handleResendEmail(); }} style={{ color: '#FFD700' }}>
          {t('verifyEmail.clickHere')}
        </a>
      </Typography>
    </Box>
  );
};