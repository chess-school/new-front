import { Rule } from 'antd/es/form';
import { TFunction } from 'i18next'; 

export const nameValidation = (t: TFunction): Rule[] => [
  { required: true, message: t('validation.required') },
  {
    validator: (_, value) =>
      value && value.length >= 2
        ? Promise.resolve()
        : Promise.reject(new Error(t('validation.name_length'))), 
  },
];

export const loginValidation = (t: TFunction): Rule[] => [
  { required: true, message: t('validation.required') },
  { type: 'email', message: t('validation.invalid_email') },
];

export const passwordValidation = (t: TFunction): Rule[] => [
  { required: true, message: t('validation.required') },
  { min: 6, message: t('validation.password_length') }, 
];