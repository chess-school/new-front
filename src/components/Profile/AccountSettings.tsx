import React, { useRef, useState } from 'react';
import {
  Avatar, Box, Button, Chip, CircularProgress, Divider, Grid, IconButton,
  InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { updateProfile, getAvatarUrl } from '@/api/profile';
import { User } from '@/types/User';

interface AccountSettingsProps {
  user: User;
  refetchUser: () => Promise<void>;
}

/** Вкладка «Аккаунт»: профиль (имя + фото), данные и смена пароля отдельной формой. */
export const AccountSettings: React.FC<AccountSettingsProps> = ({ user, refetchUser }) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase();
  const profileDirty = firstName !== user.firstName || lastName !== user.lastName || !!avatarFile;

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ firstName, lastName, avatar: avatarFile });
      await refetchUser();
      setAvatarFile(undefined);
      notification.success({ message: t('profile_edit.updated', 'Profile updated successfully') });
    } catch (error) {
      const err = error as { response?: { data?: { msg?: string } }; message?: string };
      notification.error({ message: t('profile_edit.updateFailed', 'Failed to update profile'), description: err.response?.data?.msg || err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      notification.error({ message: t('profile_edit.passwordMismatch', 'Check the current password and make sure the new passwords match (min 8 characters).') });
      return;
    }
    setSavingPw(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      notification.success({ message: t('profile_edit.passwordChanged', 'Password changed successfully') });
    } catch (error) {
      const err = error as { response?: { data?: { msg?: string } }; message?: string };
      notification.error({ message: t('profile_edit.updateFailed', 'Failed to update profile'), description: err.response?.data?.msg || err.message });
    } finally {
      setSavingPw(false);
    }
  };

  const pwToggle = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShowPw((s) => !s)} edge="end" aria-label={t('profile_edit.togglePassword', 'Show/hide password')}>
        {showPw ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Stack spacing={3}>
      {/* ── Профиль: фото + имя ── */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{t('profile.sectionProfile', 'Profile')}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack alignItems="center" spacing={1}>
            <Avatar
              src={avatarPreview || getAvatarUrl(user.uuid) || undefined}
              sx={{ width: 88, height: 88, bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700, fontSize: '1.9rem' }}
            >
              {initials}
            </Avatar>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
            <Button size="small" startIcon={<PhotoCameraRoundedIcon />} onClick={() => fileRef.current?.click()}>
              {t('profile_edit.uploadAvatar', 'Upload photo')}
            </Button>
          </Stack>
          <Grid container spacing={2} sx={{ flex: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField label={t('profile_edit.firstName', 'First name')} fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={t('profile_edit.lastName', 'Last name')} fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </Grid>
          </Grid>
        </Stack>
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button variant="contained" onClick={saveProfile} disabled={!profileDirty || savingProfile}>
            {savingProfile ? <CircularProgress size={22} /> : t('profile_edit.save', 'Save')}
          </Button>
        </Box>
      </Paper>

      {/* ── Данные аккаунта ── */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{t('profile.accountInfo', 'Account details')}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profile.email', 'Email')}</Typography>
            <Typography sx={{ fontWeight: 500, wordBreak: 'break-word' }}>{user.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profile.roles', 'Roles')}</Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {user.roles.map((r) => <Chip key={r} label={r} size="small" variant="outlined" />)}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Безопасность: смена пароля отдельной формой ── */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>{t('profile_edit.changePassword', 'Change password')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('profile.passwordHint', 'Use at least 8 characters.')}</Typography>
        {/* autoComplete current-password/new-password — подсказки менеджерам паролей. */}
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <TextField label={t('profile_edit.currentPassword', 'Current password')} type={showPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" InputProps={{ endAdornment: pwToggle }} />
          <TextField label={t('profile_edit.newPassword', 'New password')} type={showPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" InputProps={{ endAdornment: pwToggle }} />
          <TextField label={t('profile_edit.confirmPassword', 'Confirm new password')} type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" error={!!confirmPassword && confirmPassword !== newPassword} helperText={!!confirmPassword && confirmPassword !== newPassword ? t('profile_edit.passwordNoMatch', "Passwords don't match") : ' '} />
          <Divider />
          <Box sx={{ textAlign: 'right' }}>
            <Button variant="contained" onClick={savePassword} disabled={savingPw}>
              {savingPw ? <CircularProgress size={22} /> : t('profile_edit.changePassword', 'Change password')}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
