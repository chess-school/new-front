import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Avatar, Chip, Stack, Button, CircularProgress, ThemeProvider } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchClubCoach, PublicCoachProfile } from '@/features/clubs/clubsApi';
import { TrialRequestForm } from '@/features/leads/TrialRequestForm';
import { useSiteSettings } from '@/features/site/SiteSettingsContext';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { buildTheme } from '@/theme/theme';

const DEFAULT_ACCENT = '#2B50E0';
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'C';

/** Публичная страница профиля тренера клуба: /c/:slug/coaches/:uuid */
export const CoachProfilePage = () => {
  const { slug = '', uuid = '' } = useParams();
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const siteMode = settings.theme?.mode === 'dark' ? 'dark' : 'light';
  const siteTheme = useMemo(() => buildTheme(siteMode), [siteMode]);

  const [data, setData] = useState<PublicCoachProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [trialOpen, setTrialOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetchClubCoach(slug, uuid)
      .then((d) => { if (alive) { setData(d); setState('ok'); } })
      .catch(() => { if (alive) setState('notfound'); });
    return () => { alive = false; };
  }, [slug, uuid]);

  if (state === 'loading') {
    return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }
  if (state === 'notfound' || !data) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Unbounded"' }}>{t('coachProfile.notFound', 'Coach not found')}</Typography>
          <Button component={RouterLink} to={`/c/${slug}`} variant="outlined" sx={{ mt: 3 }}>{t('coachProfile.toClub', 'Back to the club site')}</Button>
        </Box>
      </Box>
    );
  }

  const { club, coach } = data;
  const accent = club.primaryColor || settings.primaryColor || DEFAULT_ACCENT;
  const rating = coach.rating && (coach.rating.standard || coach.rating.rapid || coach.rating.blitz);

  return (
    <ThemeProvider theme={siteTheme}>
      <SEOHead
        title={`${coach.name}${coach.title ? ` (${coach.title})` : ''} — ${club.name}`}
        description={coach.headline || coach.bio?.slice(0, 160)}
        canonicalPath={`/c/${club.slug}/coaches/${coach.uuid}`}
        ogTitle={coach.name}
        ogDescription={coach.headline}
        ogImage={coach.photoUrl || undefined}
        ogType="profile"
      />
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Шапка с возвратом на сайт клуба */}
        <Box component="header" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, height: 64, display: 'flex', alignItems: 'center' }}>
            <Button component={RouterLink} to={`/c/${club.slug}`} startIcon={<ArrowBackRoundedIcon />} color="inherit" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {club.name}
            </Button>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 4, md: 7 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2.5, sm: 4 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar src={coach.photoUrl || undefined} sx={{ width: 128, height: 128, bgcolor: `${accent}1A`, color: accent, fontWeight: 800, fontSize: 40 }}>{initials(coach.name)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                {coach.title && <Chip label={coach.title} sx={{ fontWeight: 700, bgcolor: `${accent}14`, color: accent }} />}
                {rating ? <Chip label={`FIDE ${coach.rating?.standard || coach.rating?.rapid || coach.rating?.blitz}`} variant="outlined" /> : null}
              </Stack>
              <Typography component="h1" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, fontSize: { xs: '2rem', md: '2.6rem' }, lineHeight: 1.05, mt: 1 }}>
                {coach.name}
              </Typography>
              {coach.headline && <Typography sx={{ mt: 1, fontSize: '1.1rem', color: 'text.secondary' }}>{coach.headline}</Typography>}
            </Box>
          </Stack>

          {!!coach.tags?.length && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
              {coach.tags.map((tg) => <Chip key={tg} label={tg} variant="outlined" />)}
            </Stack>
          )}

          {coach.bio && (
            <Typography sx={{ mt: 4, whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: 1.7, color: 'text.secondary', maxWidth: 680 }}>
              {coach.bio}
            </Typography>
          )}

          <Button
            onClick={() => setTrialOpen(true)}
            variant="contained"
            size="large"
            sx={{ mt: 4, px: 4, py: 1.5, borderRadius: 3, bgcolor: accent, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}
          >
            {t('coachProfile.bookTrial', { name: coach.name, defaultValue: 'Book a trial with {{name}}' })}
          </Button>
        </Box>
      </Box>
      <TrialRequestForm open={trialOpen} onClose={() => setTrialOpen(false)} slug={club.slug} coachUuid={coach.uuid} coachName={coach.name} />
    </ThemeProvider>
  );
};

export default CoachProfilePage;
