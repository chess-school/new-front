import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Typography, Button, Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!token) {
        navigate('/register');
        return;
      }

      try {
        const response = await axios.post('http://localhost:3000/api/auth/check-verification', { token });

        if (response.data.emailVerified) {
          setErrorMessage(t('verifyEmail.alreadyVerified'));
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setErrorMessage(t('verifyEmail.checkError'));
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [token, navigate, t]);

  const resendEmail = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/resend-verification', { token });

      if (response.data.msg === 'Email is already verified.') {
        setSuccessMessage(t('verifyEmail.alreadyVerifiedSuccess'));
      } else {
        setSuccessMessage(t('verifyEmail.resendSuccess'));
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30000);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setErrorMessage(t('verifyEmail.resendError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          {t('verifyEmail.checkingStatus')}
        </Typography>
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="error">
          {errorMessage}
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          {t('verifyEmail.backToRegister')}
        </Button>
      </Box>
    );
  }

  return (
    <Box textAlign="center" mt={5}>
      <Typography variant="h4" gutterBottom>
        {t('verifyEmail.pageTitle')}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <b>{t('verifyEmail.greeting', { firstName, lastName })}</b>
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t('verifyEmail.sentTo', { email })}
      </Typography>

      {successMessage && (
        <Typography variant="body2" color="primary" gutterBottom>
          {successMessage}
        </Typography>
      )}
      {errorMessage && (
        <Typography variant="body2" color="error" gutterBottom>
          {errorMessage}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={resendEmail}
        disabled={resendDisabled}
        sx={{ mt: 2 }}
      >
        {t('verifyEmail.resendButton')}
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate('/login')}
        sx={{ mt: 2 }}
      >
        {t('verifyEmail.backToRegister')}
      </Button>
    </Box>
  );
};
