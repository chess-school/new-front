import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, IconButton } from '@mui/material';
import { updateProfile } from '../../api/profile/auth';
import { notification } from 'antd';
import { Edit as EditIcon, Check as CheckIcon } from '@mui/icons-material';

interface EditProfileProps {
  user: any;
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileProps> = ({ user, onClose }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [editFields, setEditFields] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });

  // Функция для включения режима редактирования
  const toggleEditField = (field: keyof typeof editFields) => {
    setEditFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Функция для обновления профиля
  const handleUpdateField = async (field: string) => {
    try {
      // Проверка пароля при смене
      if (field === 'password') {
        if (newPassword !== confirmPassword) {
          notification.error({
              message: 'Пароли не совпадают',
              description: undefined
          });
          return;
        }
        if (!currentPassword) {
          notification.error({
              message: 'Укажите текущий пароль',
              description: undefined
          });
          return;
        }

        // Отправка запроса на смену пароля
        await updateProfile({ currentPassword, newPassword });
        notification.success({
            message: 'Пароль успешно обновлён',
            description: undefined
        });
      } else {
        // Обновление других полей
        const updateData: any = {};
        if (field === 'firstName') updateData.firstName = firstName;
        if (field === 'lastName') updateData.lastName = lastName;
        if (field === 'email') updateData.email = email;

        await updateProfile(updateData);
        notification.success({
            message: 'Профиль успешно обновлён',
            description: undefined
        });
      }
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      notification.error({
          message: 'Не удалось обновить профиль',
          description: undefined
      });
    }
  };

  return (
    <Paper style={{ padding: 20, marginTop: 20 }}>
      <Typography variant="h6">Редактировать профиль</Typography>

      {/* Поле Имя */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Имя"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: !editFields.firstName }}
        />
        <IconButton onClick={() => {
          if (editFields.firstName) handleUpdateField('firstName');
          toggleEditField('firstName');
        }}>
          {editFields.firstName ? <CheckIcon /> : <EditIcon />}
        </IconButton>
      </div>

      {/* Поле Фамилия */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Фамилия"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: !editFields.lastName }}
        />
        <IconButton onClick={() => {
          if (editFields.lastName) handleUpdateField('lastName');
          toggleEditField('lastName');
        }}>
          {editFields.lastName ? <CheckIcon /> : <EditIcon />}
        </IconButton>
      </div>

      {/* Поле Email */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: !editFields.email }}
        />
        <IconButton onClick={() => {
          if (editFields.email) handleUpdateField('email');
          toggleEditField('email');
        }}>
          {editFields.email ? <CheckIcon /> : <EditIcon />}
        </IconButton>
      </div>

      {/* Поле Новый пароль */}
      <div style={{ marginTop: 20 }}>
        <Typography variant="h6">Сменить пароль</Typography>
        <TextField
          label="Текущий пароль"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Новый пароль"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Подтвердите новый пароль"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleUpdateField('password')}
          style={{ marginTop: 20 }}
        >
          Обновить пароль
        </Button>
      </div>

      <Button variant="outlined" onClick={onClose} style={{ marginTop: 20 }}>
        Отмена
      </Button>
    </Paper>
  );
};

export default EditProfileForm;
