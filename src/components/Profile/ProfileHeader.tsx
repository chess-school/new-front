import React from 'react';
import { Paper, Stack, Avatar, Box, Typography, Tooltip, Chip, Button } from '@mui/material';
import { User } from '@/types/User';
import { getPrimaryRole } from '@/utils';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';

interface ProfileHeaderProps {
  user: User;
  avatarUrl: string;
  isMyProfile: boolean;
  /** Открыть вкладку «Аккаунт» для редактирования (кнопка только в своём профиле). */
  onEdit: () => void;
}

/** Компактная шапка профиля: аватар + имя (h1) + роль + «на платформе с». Без Logout — выход в сайдбаре. */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, avatarUrl, isMyProfile, onEdit }) => {
  const { t, i18n } = useTranslation();
  const primaryRole = getPrimaryRole(user.roles);
  const otherRoles = user.roles.filter((role) => role !== primaryRole);
  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase();
  // Дата в локали пользователя: 26.07.2025 (PL/UK) / Jul 26, 2025 (EN) — не US-формат.
  const memberSince = new Date(user.createdAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Paper sx={{
      p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
      // Фон и акцент из токенов (переключаются по теме).
      background: 'radial-gradient(ellipse 60% 120% at 0% 0%, rgba(var(--accent-rgb),0.10), transparent 60%), var(--bg-surface)',
    }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems="center" textAlign={{ xs: 'center', sm: 'left' }}>
        <Avatar
          src={avatarUrl || undefined}
          alt={`${user.firstName} ${user.lastName}`}
          sx={{
            width: { xs: 64, sm: 72, md: 88 }, height: { xs: 64, sm: 72, md: 88 },
            bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.9rem' },
            border: '3px solid', borderColor: 'primary.main', boxShadow: '0 0 0 5px rgba(var(--accent-rgb),0.12)', flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" useFlexGap>
            {/* Имя пользователя — единственный <h1> на странице. */}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Tooltip title={otherRoles.length > 0 ? `${t('profile.alsoRoles', 'Also')}: ${otherRoles.join(', ')}` : ''} arrow>
              {/* Нейтральный бейдж роли: токен-фон + основной текст (без белого на ярком). */}
              <Chip label={primaryRole} size="small" sx={{ bgcolor: 'surface.overlay', color: 'text.primary', fontWeight: 600, textTransform: 'capitalize' }} />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('profile.registrationDate', 'Member since')}: {memberSince}
          </Typography>
        </Box>

        {isMyProfile && (
          <Button variant="outlined" onClick={onEdit} startIcon={<EditIcon />} sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
            {t('profile.editProfile', 'Edit profile')}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};
