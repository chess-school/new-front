import React, { useState, ChangeEvent } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Avatar,
  Box,
  Link,
} from '@mui/material';
import { updateProfile } from '../../api/profile/auth';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

interface EditProfileProps {
  user: any;
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileProps> = ({ user, onClose }) => {
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.photoUrl);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!showPassword) {
        await updateProfile({
          firstName,
          lastName,
          email,
          avatar: selectedFile || undefined,
        });
        notification.success({
          message: t('profile_edit.updated'),
          description: undefined
        });
      } else {
        if (!currentPassword || newPassword !== confirmPassword) {
          notification.error({
            message: t('profile_edit.passwordMismatch'),
            description: undefined
          });
          return;
        }

        await updateProfile({
          currentPassword,
          newPassword,
          avatar: selectedFile || undefined,
        });

        notification.success({
          message: t('profile_edit.passwordChanged'),
          description: undefined
        });
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error(error);
      notification.error({
        message: t('profile_edit.updateFailed'),
        description: undefined
      });
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('profile_edit.editTitle')}</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" flexDirection="column" mb={2}>
          <Avatar src={avatarPreview} sx={{ width: 96, height: 96, mb: 1 }} />
          <Button variant="text" size="small" component="label">
            {t('profile_edit.uploadAvatar')}
            <input hidden accept="image/*" type="file" onChange={handleFileChange} />
          </Button>
        </Box>

        <TextField
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
        <TextField
          margin="dense"
          label={t('profile_edit.email')}
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {!showPassword && (
          <Box mt={1}>
            <Link component="button" variant="body2" onClick={() => setShowPassword(true)}>
              {t('profile_edit.changePassword')}
            </Link>
          </Box>
        )}

        {showPassword && (
          <Box mt={2}>
            <TextField
              margin="dense"
              label={t('profile_edit.currentPassword')}
              fullWidth
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <TextField
              margin="dense"
              label={t('profile_edit.newPassword')}
              fullWidth
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              margin="dense"
              label={t('profile_edit.confirmPassword')}
              fullWidth
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('profile_edit.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileForm;
