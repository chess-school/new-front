import { Rule } from 'antd/es/form';

const REQUIRED_FIELD = 'Обязательно для заполнения';

export const nameValidation: Rule[] = [
  { required: true, message: REQUIRED_FIELD },
  {
    validator: (_, value) =>
      value && value.length >= 2
        ? Promise.resolve()
        : Promise.reject(new Error('Имя или фамилия должны содержать минимум 2 символа')),
  },
];

export const loginValidation: Rule[] = [
  { required: true, message: REQUIRED_FIELD },
  {
    validator: (_, value) =>
      /[а-яА-Я]/.test(value)
        ? Promise.reject(new Error('Логин не может содержать русские буквы'))
        : Promise.resolve(),
  },
];

export const passwordValidation: Rule[] = [
  { required: true, message: REQUIRED_FIELD },
  {
    validator: (_, value) =>
      value && value.length >= 6
        ? Promise.resolve()
        : Promise.reject(new Error('Пароль должен быть длиннее 6 символов')),
  },
];
