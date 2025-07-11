import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { checkVerificationStatus, resendVerificationEmail } from '@/api/email-verify';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const { firstName, lastName, email } = location.state || {};

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!email) {
      console.error("Email not found in location state. Redirecting to register.");
      navigate('/register');
      return;
    }
    
    intervalIdRef.current = setInterval(async () => {
      try {
        const { emailVerified } = await checkVerificationStatus(email);
        if (emailVerified) {
          setIsPolling(false);
          navigate('/login', { state: { message: t('verifyEmail.verifiedAndReadyToLogin') } });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [email, navigate, t]);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await resendVerificationEmail(email); 

      setSuccessMessage(t('verifyEmail.resendSuccess'));
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 120000); 
    } catch (error: any) {
      if (error.response?.status === 429) {
        setErrorMessage(t('verifyEmail.resendErrorTooMany'));
      } else {
        setErrorMessage(t('verifyEmail.resendError'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box textAlign="center" mt={5} p={2}>
      {isPolling && <CircularProgress sx={{ mb: 2 }} />}
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

      {successMessage && !errorMessage && (
        <Typography variant="body2" color="primary.main" sx={{ mt: 2, fontWeight: 'bold' }}>
          {successMessage}
        </Typography>
      )}

      {errorMessage && (
        <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
          {errorMessage}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleResendEmail}
        disabled={resendDisabled || isLoading}
        sx={{ mt: 3, mb: 2 }}
      >
        {isLoading ? t('verifyEmail.sending') : t('verifyEmail.resendButton')}
      </Button>
      
      <Typography variant="caption" display="block">
        {t('verifyEmail.didNotReceive')}
      </Typography>
    </Box>
  );
};