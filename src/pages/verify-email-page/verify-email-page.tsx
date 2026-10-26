import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Typography, Button, Box, CircularProgress, Paper } from '@mui/material';
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded';
import { useTranslation } from 'react-i18next';

import { checkVerificationStatus, resendVerificationEmail, verifyEmail } from '@/api/email-verify';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const token = searchParams.get('token');
  const { firstName, lastName, email } = location.state || {};

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  // Защита от двойного вызова verify: StrictMode в dev запускает эффект дважды,
  // а эндпоинт верификации одноразовый (после первого вызова токен стирается)
  const verifyStartedRef = useRef(false);

  useEffect(() => {
    // Ветка 1: переход по ссылке из письма (?token=...) — подтверждаем email
    if (token) {
      setIsPolling(false);
      if (verifyStartedRef.current) return;
      verifyStartedRef.current = true;
      (async () => {
        try {
          await verifyEmail(token);
          setSuccessMessage(t('verifyEmail.verifiedSuccess'));
          setTimeout(() => {
            navigate('/login', { replace: true, state: { message: t('verifyEmail.verifiedAndReadyToLogin') } });
          }, 2000);
        } catch (error) {
          console.error('Email verification failed:', error);
          setErrorMessage(t('verifyEmail.verifyFailed'));
        }
      })();
      return;
    }

    // Ветка 2: переход после регистрации — опрашиваем статус по email
    if (!email) {
      console.error('Email not found in location state. Redirecting to register.');
      navigate('/register', { replace: true });
      return;
    }

    intervalIdRef.current = setInterval(async () => {
      try {
        const { emailVerified } = await checkVerificationStatus(email);
        if (emailVerified) {
          setIsPolling(false);
          navigate('/login', { replace: true, state: { message: t('verifyEmail.verifiedAndReadyToLogin') } });
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
  }, [token, email, navigate, t]);

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
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 429) {
        setErrorMessage(t('verifyEmail.resendErrorTooMany'));
      } else {
        setErrorMessage(t('verifyEmail.resendError'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box sx={{ px: 2, py: { xs: 4, md: 8 }, display: 'flex', justifyContent: 'center' }}>
    <Paper sx={{ textAlign: 'center', p: { xs: 3, sm: 5 }, maxWidth: 560, width: '100%', borderRadius: 4 }}>
      <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 2.5, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(138,43,43,0.12)', color: 'primary.main' }}>
        {isPolling || (token && !successMessage && !errorMessage) ? <CircularProgress size={28} /> : <MarkEmailUnreadRoundedIcon />}
      </Box>
      <Typography variant="h4" gutterBottom>
        {t('verifyEmail.pageTitle')}
      </Typography>
      {token ? (
        <>
          {!successMessage && !errorMessage && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {t('verifyEmail.verifying')}
            </Typography>
          )}

          {successMessage && (
            <Typography variant="body1" color="primary.main" sx={{ mt: 1, fontWeight: 'bold' }}>
              {successMessage}
            </Typography>
          )}

          {errorMessage && (
            <Typography variant="body1" color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
              {errorMessage}
            </Typography>
          )}

          {(successMessage || errorMessage) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login', { replace: true })}
              sx={{ mt: 3 }}
            >
              {t('verifyEmail.goToLogin')}
            </Button>
          )}
        </>
      ) : (
        <>
          <Typography variant="body1" gutterBottom>
            <b>{t('verifyEmail.greeting', { firstName: firstName || '', lastName: lastName || '' })}</b>
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('verifyEmail.sentTo', { email: email || t('verifyEmail.yourEmail') })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
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

          <Typography variant="caption" display="block" color="text.secondary">
            {t('verifyEmail.didNotReceive')}
          </Typography>
        </>
      )}
    </Paper>
    </Box>
  );
};