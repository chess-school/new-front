import type { RegisterOptions } from 'react-hook-form';
import { TFunction } from 'i18next';

// Правила валидации в формате react-hook-form (RegisterOptions).
// Раньше были antd Rule[] — переписаны при переходе формы авторизации с AntD на MUI.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const nameValidation = (t: TFunction): RegisterOptions => ({
  required: t('validation.required'),
  minLength: { value: 2, message: t('validation.name_length') },
});

export const loginValidation = (t: TFunction): RegisterOptions => ({
  required: t('validation.required'),
  pattern: { value: EMAIL_RE, message: t('validation.invalid_email') },
});

export const passwordValidation = (t: TFunction): RegisterOptions => ({
  required: t('validation.required'),
  minLength: { value: 6, message: t('validation.password_length') },
});
