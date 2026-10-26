import React, { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, IconButton, Link, MenuItem, Stack, TextField,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CoachDto, CoachRequestStatus, ExperienceLevel, sendCoachRequest } from '@/api/coaches';
import { tokens } from '@/theme/tokens';
import { safeUrl } from '@/utils';
import { apiErrorCode, fideTitle, fullName, initials, platformRating, requestErrorKey } from './coachUtils';

const GOALS_MAX = 1000;
const LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

interface CoachProfileDialogProps {
  coach: CoachDto | null;
  onClose: () => void;
  isAuthenticated: boolean;
  isMe: boolean;
  requestStatus?: CoachRequestStatus;
  /** Заявка отправлена — родитель обновит статусы карточек */
  onRequested: (coachId: string) => void;
  onEditMyProfile: () => void;
}

/** Профиль тренера и заявка «хочу заниматься» */
export const CoachProfileDialog: React.FC<CoachProfileDialogProps> = ({
  coach, onClose, isAuthenticated, isMe, requestStatus, onRequested, onEditMyProfile,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [experience, setExperience] = useState<ExperienceLevel>('Intermediate');
  const [goals, setGoals] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Новый тренер — чистая форма
  useEffect(() => {
    setExperience('Intermediate');
    setGoals('');
    setError(null);
    setSent(false);
  }, [coach?._id]);

  if (!coach) return null;
  const name = fullName(coach.user);
  const title = fideTitle(coach);
  const rating = platformRating(coach);
  const fide = coach.fideProfile?.rating;
  const canRequest = isAuthenticated && !isMe && !requestStatus && !sent;

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      await sendCoachRequest(coach._id, { experience, goals: goals.trim() });
      setSent(true);
      onRequested(coach._id);
    } catch (e) {
      setError(t(requestErrorKey(apiErrorCode(e))));
    } finally {
      setSending(false);
    }
  };

  const ratingCell = (label: string, value?: number) => (
    <Box sx={{ flex: 1, textAlign: 'center', py: 1, borderRadius: 2, bgcolor: 'surface.raised' }}>
      <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: '1.1rem' }}>{value || '—'}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} aria-labelledby="coach-dialog-title">
      <Box sx={{ position: 'relative', p: 3, pb: 2, background: `linear-gradient(135deg, ${tokens.accent.goldSoft}, transparent 70%)` }}>
        <IconButton onClick={onClose} aria-label={t('common.close')} sx={{ position: 'absolute', top: 12, right: 12 }}><CloseIcon /></IconButton>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={coach.user.avatarUrl || undefined} sx={{ width: 80, height: 80, fontSize: 28, fontWeight: 700, bgcolor: 'surface.overlay', color: 'primary.main' }}>
            {initials(coach.user)}
          </Avatar>
          <Box sx={{ minWidth: 0, pr: 4 }}>
            <Typography id="coach-dialog-title" variant="h5" component="h2">
              {title && <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>{title}</Box>}{name}
            </Typography>
            <Typography color="text.secondary">{coach.headline || t('coachesPage.defaultHeadline', 'Chess coach')}</Typography>
            {rating && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                ★ {rating.average.toFixed(1)} <Box component="span" sx={{ color: 'text.secondary' }}>· {t('coachesPage.reviews', { count: rating.count, defaultValue: '{{count}} reviews' })}</Box>
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5}>
          {(fide?.standard || fide?.rapid || fide?.blitz) && (
            <Box>
              <Typography variant="overline" color="text.secondary">FIDE</Typography>
              <Stack direction="row" spacing={1}>
                {ratingCell(t('coachesPage.ratingKind.standard', 'Classical'), fide?.standard)}
                {ratingCell(t('coachesPage.ratingKind.rapid', 'Rapid'), fide?.rapid)}
                {ratingCell(t('coachesPage.ratingKind.blitz', 'Blitz'), fide?.blitz)}
              </Stack>
              {safeUrl(coach.fideProfile?.profileUrl) && (
                <Link href={safeUrl(coach.fideProfile?.profileUrl)} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  {t('coachesPage.fideProfile', 'FIDE profile')} <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                </Link>
              )}
            </Box>
          )}
          <Box>
            <Typography variant="overline" color="text.secondary">{t('coaches.bio')}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }} color={coach.bio ? 'text.primary' : 'text.secondary'}>
              {coach.bio || t('coachesPage.noBio', 'The coach has not added a description yet.')}
            </Typography>
          </Box>
          {!!coach.specializations?.length && (
            <Box>
              <Typography variant="overline" color="text.secondary">{t('coachesPage.specializations', 'Specializations')}</Typography>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {coach.specializations.map((s) => <Chip key={s} label={s} variant="outlined" size="small" />)}
              </Stack>
            </Box>
          )}

          {/* Заявка */}
          {isMe ? null : !isAuthenticated ? (
            <Alert severity="info" action={<Button component={RouterLink} to="/login" color="inherit" size="small">{t('navbar.login')}</Button>}>
              {t('coachesPage.loginToRequest', 'Log in to send a request to this coach.')}
            </Alert>
          ) : sent || requestStatus === 'pending' ? (
            <Alert severity="success">{t('coachesPage.requestSentLong', { name: coach.user.firstName, defaultValue: 'Request sent. {{name}} will reply soon — you will get a notification.' })}</Alert>
          ) : requestStatus === 'approved' ? (
            <Alert severity="success">{t('coachesPage.alreadyYourCoach', 'You already train with this coach.')}</Alert>
          ) : (
            <Box component="form" id="coach-request-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}
              sx={{ p: 2, borderRadius: 2, bgcolor: 'surface.raised', border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>{t('coachesPage.requestTitle', { name: coach.user.firstName, defaultValue: 'Train with {{name}}' })}</Typography>
              <Stack spacing={2}>
                <TextField select label={t('coaches.level')} value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)} fullWidth>
                  {LEVELS.map((l) => <MenuItem key={l} value={l}>{t(`coaches.level${l}`)}</MenuItem>)}
                </TextField>
                <TextField
                  label={t('coaches.goals')} value={goals} onChange={(e) => setGoals(e.target.value.slice(0, GOALS_MAX))}
                  multiline minRows={3} fullWidth placeholder={t('coachesPage.goalsPlaceholder', 'e.g. reach 1800 by summer, improve endgames')}
                  helperText={`${goals.length} / ${GOALS_MAX}`}
                />
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {isMe && <Button onClick={onEditMyProfile} variant="outlined" color="inherit">{t('coaches.editProfile')}</Button>}
        <Button onClick={onClose} color="inherit">{t('coaches.close')}</Button>
        {canRequest && (
          <Button type="submit" form="coach-request-form" variant="contained" startIcon={<SendRoundedIcon />} disabled={sending}>
            {t('coaches.sendRequest')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
