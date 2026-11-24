import React, { useContext, useState } from 'react';
import { useForm, type RegisterOptions } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box, Typography, TextField, Button, Alert, Collapse,
  IconButton, InputAdornment, Link as MuiLink,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { FaChessKnight } from 'react-icons/fa';
import { isAxiosError } from 'axios';

import { buildTheme } from '@/theme/theme';
import { loginUser } from '@/api/login';
import { registerUser } from '@/api/register/register';
import { LoginCredentials, RegistrationData } from '@/types/Auth';
import { loginValidation, passwordValidation, nameValidation } from '@/shared/validation';
import { AuthContext } from '@/context/AuthContext';
import { createClub as createClubApi } from '@/features/clubs/clubsApi';
import { useClubStore } from '@/features/clubs/clubStore';
import './styles.scss';

// Экран авторизации всегда тёмный (фирменный «угольный» экран) независимо от темы приложения.
const authTheme = buildTheme('dark');

/** Сообщение бэкенда из ошибки запроса ({ msg } в ответе), если оно есть */
const apiErrorMsg = (error: unknown): string | undefined =>
  isAxiosError<{ msg?: string }>(error) ? error.response?.data?.msg : undefined;

/**
 * Гостевой онбординг: на лендинге гость заполняет клуб ДО регистрации — черновик лежит в
 * localStorage('debiut.clubDraft'). После первого входа дочитываем его и создаём клуб, иначе
 * клуб гостя терялся навсегда. Возвращает true, если клуб был создан (→ ведём в кабинет).
 */
const consumeClubDraft = async (): Promise<boolean> => {
  let raw: string | null = null;
  try { raw = localStorage.getItem('debiut.clubDraft'); } catch { /* ignore */ }
  if (!raw) return false;
  // Черновик дочитываем один раз: чистим ДО создания, чтобы повторный вход не плодил клубы.
  try { localStorage.removeItem('debiut.clubDraft'); } catch { /* ignore */ }
  try {
    const d = JSON.parse(raw) as { name?: string; slug?: string; city?: string; color?: string; plan?: string };
    if (!d?.name) return false;
    const club = await createClubApi({
      name: d.name,
      slug: d.slug,
      city: d.city,
      plan: (['start', 'club', 'academy'].includes(d.plan ?? '') ? d.plan : undefined) as 'start' | 'club' | 'academy' | undefined,
      brand: d.color ? { primaryColor: d.color } : undefined,
    });
    try { localStorage.setItem('debiut.activeClub', club._id); } catch { /* ignore */ }
    await useClubStore.getState().load(true);
    return true;
  } catch {
    return false; // не блокируем вход, если создание клуба не удалось
  }
};

interface AuthFormProps {
  mode: 'login' | 'register';
}

type FormValues = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
};

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('AuthForm must be used within an AuthProvider');
  }
  const { login: authLogin } = auth;

  const isLoginMode = mode === 'login';
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: 'onTouched' });

  // register() возвращает ref — у MUI TextField это inputRef, а не ref корня.
  const field = (name: keyof FormValues, rules: RegisterOptions) => {
    const { ref, ...rest } = register(name, rules as RegisterOptions<FormValues, typeof name>);
    return { inputRef: ref, ...rest };
  };

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      if (isLoginMode) {
        const creds: LoginCredentials = { email: values.email, password: values.password };
        const loginResponse = await loginUser(creds);
        const fullUserProfile = await authLogin(loginResponse);
        if (fullUserProfile && fullUserProfile.uuid) {
          // Если это первый вход после гостевого онбординга — создаём отложенный клуб и ведём
          // в кабинет (с перечитанным профилем: бэкенд выдал владельцу роль COACH).
          const createdClub = await consumeClubDraft();
          if (createdClub) {
            await auth.refetchUser();
            navigate('/club', { replace: true });
          } else {
            navigate(`/profile/${fullUserProfile.uuid}`, { replace: true });
          }
        } else {
          throw new Error('Failed to retrieve user profile after login.');
        }
      } else {
        const data: RegistrationData = {
          firstName: values.firstName ?? '',
          lastName: values.lastName ?? '',
          email: values.email,
          password: values.password,
        };
        await registerUser(data);
        navigate('/verify-email', {
          replace: true,
          state: { email: data.email, firstName: data.firstName, lastName: data.lastName },
        });
      }
    } catch (error) {
      setApiError(
        apiErrorMsg(error) ||
          (isLoginMode ? t('auth.errors.invalid_credentials') : t('register.error.description')),
      );
    }
  });

  return (
    <ThemeProvider theme={authTheme}>
      <Box className="auth-form-container">
        <Box className="auth-header" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <Box className="auth-header__mark" aria-hidden>
            <FaChessKnight />
          </Box>
          <Typography component="span" className="auth-header__brand">
            {t('common.brand', 'debiut')}
          </Typography>
        </Box>

        <Typography component="h1" className="auth-header__title">
          {isLoginMode ? t('auth.sign_in') : t('register.title')}
        </Typography>

        <Collapse in={!!apiError} sx={{ width: '100%' }}>
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        </Collapse>

        <Box
          component="form"
          className="auth-form-body"
          onSubmit={onSubmit}
          noValidate
          autoComplete="off"
        >
          {!isLoginMode && (
            <>
              <TextField
                {...field('firstName', nameValidation(t))}
                label={t('register.name')}
                placeholder={t('register.placeholder.name')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                fullWidth
                margin="normal"
              />
              <TextField
                {...field('lastName', nameValidation(t))}
                label={t('register.lastName')}
                placeholder={t('register.placeholder.lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                fullWidth
                margin="normal"
              />
            </>
          )}

          <TextField
            {...field('email', loginValidation(t))}
            type="email"
            label={t('common.email')}
            placeholder={t('common.placeholder.email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            margin="normal"
          />

          <TextField
            {...field('password', passwordValidation(t))}
            type={showPassword ? 'text' : 'password'}
            label={t('common.password')}
            placeholder={t('common.placeholder.password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('auth.togglePassword', 'Toggle password visibility')}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2.5, height: 50, fontWeight: 700, fontSize: '1rem' }}
          >
            {isLoginMode ? t('auth.sign_in') : t('register.submit')}
          </Button>
        </Box>

        <Box className="auth-form-footer">
          {isLoginMode ? (
            <>
              {t('auth.no_account')}{' '}
              <MuiLink component="button" type="button" className="auth-form-link" onClick={() => navigate('/register')}>
                {t('auth.sign_up')}
              </MuiLink>
            </>
          ) : (
            <>
              {t('register.haveAccount')}{' '}
              <MuiLink component="button" type="button" className="auth-form-link" onClick={() => navigate('/login')}>
                {t('register.login')}
              </MuiLink>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};
