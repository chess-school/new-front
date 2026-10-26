import { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Grid, Paper, Chip, CircularProgress, Avatar } from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { fetchClubBySlug, ClubPublic } from '@/features/clubs/clubsApi';
import { useClubStore } from '@/features/clubs/clubStore';

const DEFAULT_ACCENT = '#2B50E0';
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'C';
// Контрастный текст на акценте (грубая оценка яркости)
const onAccent = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#fff';
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141B2E' : '#ffffff';
};

export const ClubSitePage = () => {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ClubPublic | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetchClubBySlug(slug)
      .then((d) => { if (alive) { setData(d); setState('ok'); } })
      .catch(() => { if (alive) setState('notfound'); });
    return () => { alive = false; };
  }, [slug]);

  if (state === 'loading') {
    return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }
  if (state === 'notfound' || !data) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk"' }}>{t('clubSite.notFound', 'Club not found')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{t('clubSite.notFoundDesc', 'This club page does not exist or is not public.')}</Typography>
          <Button component={RouterLink} to="/" variant="outlined" sx={{ mt: 3 }}>{t('clubSite.toPlatform', 'Go to debiut')}</Button>
        </Box>
      </Box>
    );
  }

  const { club, coaches, groupsCount, membership } = data;
  const accent = club.brand?.primaryColor || DEFAULT_ACCENT;
  const ink = onAccent(accent);

  const enterClub = () => {
    try { localStorage.setItem('debiut.activeClub', club._id); } catch { /* ignore */ }
    useClubStore.getState().reset();
    navigate(membership?.role === 'student' ? '/profile' : '/club');
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Header клуба */}
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(243,244,247,0.82)', backdropFilter: 'blur(14px)' }}>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, height: 64, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: accent, color: ink, fontWeight: 800, fontSize: 14 }}>{initials(club.name)}</Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }} noWrap>{club.name}</Typography>
          </Stack>
          {membership ? (
            <Button onClick={enterClub} variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ bgcolor: accent, color: ink, borderRadius: 2.5, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>
              {t('clubSite.enter', 'Open my account')}
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/login" color="inherit" sx={{ color: 'text.primary', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}>{t('clubSite.login', 'Log in')}</Button>
              <Button component={RouterLink} to={`/register?club=${club.slug}`} variant="contained" sx={{ bgcolor: accent, color: ink, borderRadius: 2.5, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>{t('clubSite.join', 'Join the club')}</Button>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 60% at 20% 0%, ${accent}22, transparent 70%)` }} />
        <Box sx={{ position: 'relative', maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 7, md: 11 } }}>
          <Chip icon={<PlaceRoundedIcon />} label={club.city || t('clubSite.chessClub', 'Chess club')} sx={{ mb: 3, bgcolor: `${accent}14`, color: accent, fontWeight: 700, '& .MuiChip-icon': { color: accent } }} />
          <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.03, fontSize: { xs: '2.6rem', md: '4rem' }, maxWidth: 16 + 'ch' }}>
            {club.name}
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: 'text.secondary', maxWidth: 560 }}>
            {t('clubSite.tagline', 'Group and individual lessons, online classes on a shared board, puzzles and progress tracking — for every level.')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4.5 }}>
            {membership ? (
              <Button size="large" onClick={enterClub} endIcon={<ArrowForwardRoundedIcon />} variant="contained" sx={{ bgcolor: accent, color: ink, px: 4, py: 1.5, borderRadius: 3, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>
                {t('clubSite.enter', 'Open my account')}
              </Button>
            ) : (
              <Button size="large" component={RouterLink} to={`/register?club=${club.slug}`} endIcon={<ArrowForwardRoundedIcon />} variant="contained" sx={{ bgcolor: accent, color: ink, px: 4, py: 1.5, borderRadius: 3, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>
                {t('clubSite.join', 'Join the club')}
              </Button>
            )}
            <Button size="large" component={RouterLink} to="/puzzles" variant="outlined" color="inherit" sx={{ px: 4, py: 1.5, borderRadius: 3, color: 'text.primary', borderColor: 'divider' }}>
              {t('clubSite.tryPuzzles', 'Try a puzzle')}
            </Button>
          </Stack>

          {/* Факты клуба */}
          <Stack direction="row" spacing={{ xs: 3, md: 6 }} sx={{ mt: 6, flexWrap: 'wrap' }}>
            <Box><Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 800, fontSize: '1.8rem', color: accent, lineHeight: 1 }}>{groupsCount}</Typography><Typography variant="body2" color="text.secondary">{t('clubSite.groups', 'groups')}</Typography></Box>
            <Box><Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 800, fontSize: '1.8rem', color: accent, lineHeight: 1 }}>{coaches.length}</Typography><Typography variant="body2" color="text.secondary">{t('clubSite.coaches', 'coaches')}</Typography></Box>
          </Stack>
        </Box>
      </Box>

      {/* Тренеры */}
      {coaches.length > 0 && (
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 6, md: 9 } }}>
          <Typography variant="overline" sx={{ color: accent, fontWeight: 700 }}>{t('clubSite.ourCoaches', 'Our coaches')}</Typography>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk"', fontWeight: 800, mb: 3 }}>{t('clubSite.coachesTitle', 'Who will teach you')}</Typography>
          <Grid container spacing={2.5}>
            {coaches.map((c, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Stack direction="row" spacing={1.75} alignItems="center">
                    <Avatar sx={{ width: 48, height: 48, bgcolor: `${accent}1A`, color: accent, fontWeight: 700 }}>{initials(c.name)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {c.title && <Chip label={c.title} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${accent}14`, color: accent }} />}
                        <Typography sx={{ fontWeight: 700 }} noWrap>{c.name}</Typography>
                      </Stack>
                      {c.headline && <Typography variant="body2" color="text.secondary" noWrap>{c.headline}</Typography>}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* CTA + футер платформы */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4 }}>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {club.name} · {t('clubSite.poweredBy', 'powered by')} <Box component={RouterLink} to="/" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>debiut</Box>
          </Typography>
          {!membership && (
            <Button component={RouterLink} to={`/register?club=${club.slug}`} variant="contained" sx={{ bgcolor: accent, color: ink, borderRadius: 2.5, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>{t('clubSite.join', 'Join the club')}</Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ClubSitePage;
