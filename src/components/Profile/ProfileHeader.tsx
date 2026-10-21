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
    <Paper sx={{
      p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 60% 120% at 0% 0%, rgba(227,179,65,0.12), transparent 60%), #161b22',
    }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
        <Avatar src={avatarUrl} alt={`${user.firstName} ${user.lastName}`} sx={{ width: { xs: 96, md: 120 }, height: { xs: 96, md: 120 }, border: '3px solid', borderColor: 'primary.main', boxShadow: '0 0 0 6px rgba(227,179,65,0.12)' }} />
        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{xs: 'center', md: 'flex-start'}} flexWrap="wrap" useFlexGap>
            <Typography variant="h4">{user.firstName} {user.lastName}</Typography>
            <Tooltip title={otherRoles.length > 0 ? `Also: ${otherRoles.join(', ')}` : ''} arrow>
              <Chip label={primaryRole} color={roleChipColor} size="small" sx={{ textTransform: 'capitalize' }} />
            </Tooltip>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('profile.registrationDate')}: {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: { xs: 1, md: 0 }, width: { xs: '100%', sm: 'auto' } }}>
            {isMyProfile ? (
                <>
                    <Button variant="outlined" onClick={onEdit} startIcon={<EditIcon />}>{t('profile.editProfile')}</Button>
                    <Button variant="outlined" color="error" onClick={onLogout} startIcon={<LogoutIcon />}>{t('profile.logout')}</Button>
                </>
            ) : (
                primaryRole === 'COACH' && <Button variant="contained" color="primary" startIcon={<SendIcon />}>Send Request</Button>
            )}
        </Stack>
      </Stack>
    </Paper>
  );
};