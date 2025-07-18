// src/pages/profile-page/components/ProfileHeader.tsx

import React from 'react';
import { Paper, Stack, Avatar, Box, Typography, Tooltip, Chip, Button, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { User } from '@/types/User';
import { getPrimaryRole } from '@/utils';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import SendIcon from '@mui/icons-material/Send';

interface ProfileHeaderProps {
  user: User;
  coach: User | null;
  avatarUrl: string;
  isMyProfile: boolean;
  onEdit: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, coach, avatarUrl, isMyProfile, onEdit, onLogout, t }) => {
  const primaryRole = getPrimaryRole(user.roles);
  const otherRoles = user.roles.filter(role => role !== primaryRole);
  const roleChipColor = { admin: 'secondary', coach: 'primary', student: 'success', user: 'default' }[primaryRole] as "secondary" | "primary" | "success" | "default";
  
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
          {coach && <Typography sx={{color: 'rgba(255,255,255,0.7)', mt: 1}}>Coach: <MuiLink component={RouterLink} to={`/profile/${coach._id}`} color="inherit" sx={{textDecoration: 'underline'}}>{coach.firstName} {coach.lastName}</MuiLink></Typography>}
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5 }}>{t('profile.registrationDate')}: {new Date(user.registrationDate).toLocaleDateString()}</Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: { xs: 3, md: 0 } }}>
            {isMyProfile ? (
                <>
                    <Button variant="outlined" onClick={onEdit} startIcon={<EditIcon />} sx={{ color: '#FFD700', borderColor: 'rgba(255, 215, 0, 0.5)', '&:hover': {borderColor: '#FFD700'} }}>{t('profile.editProfile')}</Button>
                    <Button variant="contained" color="error" onClick={onLogout} startIcon={<LogoutIcon />}>{t('profile.logout')}</Button>
                </>
            ) : (
                primaryRole === 'coach' && <Button variant="contained" color="primary" startIcon={<SendIcon />}>Send Request</Button>
            )}
        </Stack>
      </Stack>
    </Paper>
  );
};