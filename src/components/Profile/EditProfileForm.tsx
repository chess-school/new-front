import React, { useState } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Link,
  CircularProgress
} from '@mui/material';
import { updateProfile } from '@/api/profile'; // <-- Используем V2 сервис
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { User } from '@/types/User';

interface EditProfileProps {
  user: User;
  onClose: () => void;
  refetchUser: () => Promise<void>; // <-- Функция для обновления AuthContext
}

export const EditProfileForm: React.FC<EditProfileProps> = ({ user, onClose, refetchUser }) => {
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: {
        firstName: string,
        lastName: string,
        currentPassword?: string,
        newPassword?: string,
      } = {
        firstName,
        lastName,
      };

      if (showPassword) {
        if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
          notification.error({
            message: t('profile_edit.passwordMismatch', 'Password error. Ensure current password is correct and new passwords match (min 6 chars).'),
            description: undefined
          });
          setIsSubmitting(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload); // Вызов V2 API
      await refetchUser(); // Обновление данных в AuthContext

      notification.success({
        message: t('profile_edit.updated', 'Profile updated successfully'),
        description: undefined
      });
      onClose(); // Закрываем модальное окно

    } catch (error: any) {
      console.error(error);
      notification.error({
        message: t('profile_edit.updateFailed', 'Update failed'),
        description: error.response?.data?.msg || error.message
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('profile_edit.editTitle')}</DialogTitle>
      <DialogContent>
        {/* Блок аватара удален, так как кастомная загрузка пока не реализована */}

        <TextField
          autoFocus
          margin="dense"
          label={t('profile_edit.firstName')}
          fullWidth
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          margin="dense"
          label={t('profile_edit.lastName')}
          fullWidth
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        
        {/* Email больше не редактируем, т.к. это обычно более сложный процесс с верификацией */}

        {!showPassword && (
          <Box mt={1}>
            <Link component="button" variant="body2" onClick={() => setShowPassword(true)}>
              {t('profile_edit.changePassword')}
            </Link>
          </Box>
        )}

        {showPassword && (
          <Box mt={2}>
            <TextField margin="dense" label={t('profile_edit.currentPassword')} fullWidth type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <TextField margin="dense" label={t('profile_edit.newPassword')} fullWidth type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <TextField margin="dense" label={t('profile_edit.confirmPassword')} fullWidth type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('profile_edit.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : t('profile_edit.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};