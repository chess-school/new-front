import React from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useForm, SubmitHandler, Controller, useFormState } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '@/api/register/register'
import './register-form.css';
import { loginValidation, passwordValidation, nameValidation } from './validation';

interface IRegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const RegisterForm: React.FC = () => {
  const { handleSubmit, control } = useForm<IRegisterForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });
  const { errors } = useFormState({ control });
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<IRegisterForm> = async (data) => {
    try {
        const response = await registerUser(data);
        
        navigate(`/verify-email?token=${response.token}`, {
            state: {
                firstName: response.firstName,
                lastName: response.lastName,
                email: response.email,
            },
        });
    } catch (error) {
        alert('Registration failed. Please try again.');
    }
};


  return (
    <div className="register-form">
      <Typography variant="h4" component="div">
        Регистрация
      </Typography>
      <form className="register-form__form" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="firstName"
          rules={nameValidation}
          render={({ field }) => (
            <TextField
              label="Имя"
              onChange={(e) => field.onChange(e)}
              value={field.value}
              fullWidth
              size="small"
              margin="normal"
              error={!!errors.firstName?.message}
              helperText={errors?.firstName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          rules={nameValidation}
          render={({ field }) => (
            <TextField
              label="Фамилия"
              onChange={(e) => field.onChange(e)}
              value={field.value}
              fullWidth
              size="small"
              margin="normal"
              error={!!errors.lastName?.message}
              helperText={errors?.lastName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={loginValidation}
          render={({ field }) => (
            <TextField
              label="Email"
              onChange={(e) => field.onChange(e)}
              value={field.value}
              fullWidth
              size="small"
              margin="normal"
              error={!!errors.email?.message}
              helperText={errors?.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={passwordValidation}
          render={({ field }) => (
            <TextField
              label="Пароль"
              onChange={(e) => field.onChange(e)}
              value={field.value}
              fullWidth
              size="small"
              margin="normal"
              type="password"
              error={!!errors.password?.message}
              helperText={errors?.password?.message}
            />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disableElevation
          sx={{ marginTop: 2 }}
        >
          Зарегистрироваться
        </Button>
      </form>
      <div className="auth-form__footer">
        <Typography variant="subtitle1" component="span">
          Already have an account{' '}
        </Typography>
        <Typography
          variant="subtitle1"
          component="span"
          sx={{ color: 'blue', cursor: 'pointer' }}
          onClick={() => navigate('/login')} 
        >
          login
        </Typography>
      </div>
    </div>
  );
};
