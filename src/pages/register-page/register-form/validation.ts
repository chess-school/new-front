// /pages/register-page/validation.ts
const REQUIRED_FIELD = 'Обязательно для заполнения';

export const nameValidation = {
  required: REQUIRED_FIELD,
  validate: (value: string) => {
    if (value.length < 2) {
      return 'Имя или фамилия должны содержать минимум 2 символа';
    }
    return true;
  }
};

export const loginValidation = {
  required: REQUIRED_FIELD,
  validate: (value: string) => {
    if (value.match(/[а-яА-Я]/)) {
      return 'Логин не может содержать русские буквы';
    }
    return true;
  }
};

export const passwordValidation = {
  required: REQUIRED_FIELD,
  validate: (value: string) => {
    if (value.length < 6) {
      return 'Пароль должен быть длиннее 6 символов';
    }
    return true;
  }
};
