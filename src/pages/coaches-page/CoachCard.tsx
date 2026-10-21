import React from 'react';
import { Avatar, Box, Button, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from 'react-i18next';
import { CoachDto, CoachRequestStatus } from '@/api/coaches';
import { tokens } from '@/theme/tokens';
import { bestFideRating, fideTitle, fullName, initials, platformRating } from './coachUtils';

interface CoachCardProps {
  coach: CoachDto;
  /** Статус моей заявки этому тренеру */
  requestStatus?: CoachRequestStatus;
  isMe?: boolean;
  onOpen: (coach: CoachDto) => void;
}

/** Карточка тренера: аватар, звание FIDE, рейтинг, специализации, статус моей заявки */
export const CoachCard: React.FC<CoachCardProps> = ({ coach, requestStatus, isMe, onOpen }) => {
  const { t } = useTranslation();
  const title = fideTitle(coach);
  const fide = bestFideRating(coach);
  const rating = platformRating(coach);
  const specializations = (coach.specializations ?? []).filter(Boolean);

  return (
    <Card data-testid="coach-card" sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      '&:hover': { borderColor: 'rgba(227,179,65,0.35)', transform: 'translateY(-2px)', boxShadow: '0 16px 32px rgba(0,0,0,0.35)' },
    }}>
      <CardActionArea onClick={() => onOpen(coach)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={coach.user.avatarUrl || undefined} alt={fullName(coach.user)}
            sx={{ width: 64, height: 64, fontSize: 22, fontWeight: 700, bgcolor: 'surface.overlay', color: 'primary.main', border: 2, borderColor: title ? 'primary.main' : 'divider' }}>
            {initials(coach.user)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {title && (
                <Box component="span" sx={{ px: 0.75, borderRadius: 1, bgcolor: tokens.accent.goldSoft, color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', lineHeight: '20px' }}>
                  {title}
                </Box>
              )}
              <Typography variant="h6" noWrap>{fullName(coach.user)}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {coach.headline || t('coachesPage.defaultHeadline', 'Chess coach')}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }} alignItems="center">
              {fide && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: tokens.font.mono }}>
                  FIDE {fide.value} · {t(`coachesPage.ratingKind.${fide.kind}`, fide.kind)}
                </Typography>
              )}
              {rating && (
                <Stack direction="row" spacing={0.25} alignItems="center" aria-label={t('coachesPage.platformRating', 'Rating on the platform')}>
                  <StarRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" fontWeight={700}>{rating.average.toFixed(1)}</Typography>
                  <Typography variant="caption" color="text.secondary">({rating.count})</Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        </Stack>

        {coach.bio && (
          <Typography variant="body2" color="text.secondary" sx={{
            mt: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {coach.bio}
          </Typography>
        )}
        {specializations.length > 0 && (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
            {specializations.slice(0, 4).map((s) => <Chip key={s} label={s} size="small" variant="outlined" />)}
            {specializations.length > 4 && <Chip label={`+${specializations.length - 4}`} size="small" />}
          </Stack>
        )}
      </CardActionArea>
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        {isMe ? (
          <Chip label={t('coachesPage.thisIsYou', 'This is your profile')} color="primary" variant="outlined" sx={{ width: '100%' }} />
        ) : requestStatus === 'pending' ? (
          <Chip icon={<HourglassTopRoundedIcon />} label={t('coachesPage.requestSent', 'Request sent — awaiting reply')} sx={{ width: '100%' }} />
        ) : requestStatus === 'approved' ? (
          <Chip icon={<CheckCircleRoundedIcon />} color="success" variant="outlined" label={t('coachesPage.yourCoach', 'Your coach')} sx={{ width: '100%' }} />
        ) : (
          <Button variant="contained" fullWidth onClick={() => onOpen(coach)}>{t('coaches.viewProfile')}</Button>
        )}
      </Box>
    </Card>
  );
};
