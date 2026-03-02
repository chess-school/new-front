import React from 'react';
import { Paper, Stack, Avatar, Box, Typography, Tooltip, Chip, Button } from '@mui/material';
import { User } from '@/types/User'; // Используем алиас для консистентности
import { getPrimaryRole } from '@/utils'; // Предполагается, что эта утилита у вас есть
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'react-i18next'; // Используем хук для t

interface ProfileHeaderProps {
  user: User;
  avatarUrl: string;
  isMyProfile: boolean;
  onEdit: () => void;
  onLogout: () => void;
  // coach и t теперь опциональны или берутся из хука
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, avatarUrl, isMyProfile, onEdit, onLogout }) => {
  const { t } = useTranslation();
  const primaryRole = getPrimaryRole(user.roles);
  const otherRoles = user.roles.filter(role => role !== primaryRole);
  const roleChipColor = { ADMIN: 'secondary', COACH: 'primary', USER: 'default' }[primaryRole] as "secondary" | "primary" | "default" | undefined;
  
  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: '#1c1c1c', borderRadius: 4, color: 'white' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
        <Avatar src={avatarUrl} alt={`${user.firstName} ${user.lastName}`} sx={{ width: 120, height: 120, border: '4px solid #FFD700' }} />
        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent={{xs: 'center', md: 'flex-start'}}>
            <Typography variant="h4" fontWeight="bold">{user.firstName} {user.lastName}</Typography>
            <Tooltip title={otherRoles.length > 0 ? `Also: ${otherRoles.join(', ')}` : ''} arrow>
              <Chip label={primaryRole} color={roleChipColor} size="small" sx={{ textTransform: 'capitalize' }} />
            </Tooltip>
          </Stack>
          
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5 }}>
            {t('profile.registrationDate')}: {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: { xs: 3, md: 0 } }}>
            {isMyProfile ? (
                <>
                    <Button variant="outlined" onClick={onEdit} startIcon={<EditIcon />} sx={{ color: '#FFD700', borderColor: 'rgba(255, 215, 0, 0.5)', '&:hover': {borderColor: '#FFD700'} }}>{t('profile.editProfile')}</Button>
                    <Button variant="contained" color="error" onClick={onLogout} startIcon={<LogoutIcon />}>{t('profile.logout')}</Button>
                </>
            ) : (
                primaryRole === 'COACH' && <Button variant="contained" color="primary" startIcon={<SendIcon />}>Send Request</Button>
            )}
        </Stack>
      </Stack>
    </Paper>
  );
};