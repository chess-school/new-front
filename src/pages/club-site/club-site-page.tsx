import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, Stack, Grid, Paper, Chip, CircularProgress, Avatar, Alert, ThemeProvider } from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { fetchClubBySlug, ClubPublic } from '@/features/clubs/clubsApi';
import { useClubStore } from '@/features/clubs/clubStore';
import { fetchPublicPage, SitePage } from '@/features/site/pagesApi';
import { PageRenderer } from '@/features/site/PageRenderer';
import { useSiteSettings } from '@/features/site/SiteSettingsContext';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { buildTheme } from '@/theme/theme';

const DEFAULT_ACCENT = '#2B50E0';
// Публичный сайт клуба использует ТЕМУ БРЕНДА, выбранную владельцем (светлая по умолчанию),
// а не mob-theme зрителя. MUI-палитру даём через локальный ThemeProvider; стекло шапки —
// режим-зависимый литерал (единственное прямое использование CSS-переменной убрано).
// Стандартные страницы сайта клуба (slug'и совпадают с редактором в кабинете). В навигации
// показываем Home всегда + те страницы, которые владелец опубликовал (есть блоки).
const STD_PAGES: Array<{ slug: string; labelKey: string; fallback: string }> = [
  { slug: 'home', labelKey: 'site.page.home', fallback: 'Home' },
  { slug: 'about', labelKey: 'site.page.about', fallback: 'About us' },
  { slug: 'coaches', labelKey: 'site.page.coaches', fallback: 'Coaches' },
  { slug: 'achievements', labelKey: 'site.page.achievements', fallback: 'Achievements' },
];
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'C';
// Контрастный текст на акценте (грубая оценка яркости)
const onAccent = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#fff';
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141B2E' : '#ffffff';
};

export const ClubSitePage = () => {
  const { slug = '', page = 'home' } = useParams();
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const siteMode = settings.theme?.mode === 'dark' ? 'dark' : 'light';
  const siteTheme = useMemo(() => buildTheme(siteMode), [siteMode]);
  const navigate = useNavigate();
  const [data, setData] = useState<ClubPublic | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  // Опубликованные страницы клуба из блоков (шаг 3/4). Ключ — slug, значение — страница или null.
  const [pages, setPages] = useState<Record<string, SitePage | null>>({});

  useEffect(() => {
    let alive = true;
    setState('loading');
    setPages({});
    fetchClubBySlug(slug)
      .then((d) => { if (alive) { setData(d); setState('ok'); } })
      .catch(() => { if (alive) setState('notfound'); });
    // Параллельно тянем все стандартные страницы (необязательны — нет/пусто → тихий фолбэк).
    Promise.all(STD_PAGES.map((p) => fetchPublicPage(p.slug, slug).then((pg) => [p.slug, pg && pg.blocks.length ? pg : null] as const)))
      .then((entries) => { if (alive) setPages(Object.fromEntries(entries)); });
    return () => { alive = false; };
  }, [slug]);

  if (state === 'loading') {
    return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }
  if (state === 'notfound' || !data) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Unbounded"' }}>{t('clubSite.notFound', 'Club not found')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{t('clubSite.notFoundDesc', 'This club page does not exist or is not public.')}</Typography>
          <Button component={RouterLink} to="/" variant="outlined" sx={{ mt: 3 }}>{t('clubSite.toPlatform', 'Go to debiut')}</Button>
        </Box>
      </Box>
    );
  }

  const { club, coaches, groupsCount, membership, published } = data;
  // Идентичность сайта — из настроек клуба (Site name / tagline / бренд), а не из generic-i18n.
  const siteName = (settings.isClub && settings.siteName) || club.name;
  const accent = settings.primaryColor || club.brand?.primaryColor || DEFAULT_ACCENT;
  const ink = onAccent(accent);
  const heroSubtitle = settings.tagline || t('clubSite.tagline', 'Group and individual lessons, online classes on a shared board, puzzles and progress tracking — for every level.');
  // Факты в hero: показываем ТОЛЬКО ненулевые (без «0 groups · 0 coaches»).
  const heroFacts = [
    groupsCount > 0 ? { value: String(groupsCount), label: t('clubSite.groups', 'groups') } : null,
    coaches.length > 0 ? { value: String(coaches.length), label: t('clubSite.coaches', 'coaches') } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  // Навигация: Home всегда + опубликованные страницы. Текущая — из :page (дефолт home).
  const current = STD_PAGES.some((p) => p.slug === page) ? page : 'home';
  const navItems = STD_PAGES.filter((p) => p.slug === 'home' || pages[p.slug]);
  const currentPage = pages[current] || null;
  const currentMeta = STD_PAGES.find((p) => p.slug === current);

  const enterClub = () => {
    try { localStorage.setItem('debiut.activeClub', club._id); } catch { /* ignore */ }
    useClubStore.getState().reset();
    navigate(membership?.role === 'student' ? '/profile' : '/club');
  };

  return (
    <ThemeProvider theme={siteTheme}>
      <SEOHead
        title={`${siteName}${club.city ? ` — ${club.city}` : ''}`}
        description={heroSubtitle}
        canonicalPath={`/c/${club.slug}`}
        ogTitle={siteName}
        ogDescription={heroSubtitle}
        ogImage={settings.logoUrl || club.logoUrl || undefined}
        ogType="website"
      />
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Клуб не опубликован (suspended) — страницу видит только владелец/участник как превью */}
      {published === false && (
        <Alert severity="warning" sx={{ borderRadius: 0, justifyContent: 'center', '& .MuiAlert-message': { fontWeight: 600 } }}>
          {t('clubSite.notPublishedPreview', 'This page is not published yet — visible only to you.')}
        </Alert>
      )}
      {/* Header клуба */}
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid', borderColor: 'divider', bgcolor: siteMode === 'dark' ? 'rgba(18,24,38,0.82)' : 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)' }}>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, height: 64, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
            {settings.logoUrl ? (
              <Box component="img" src={settings.logoUrl} alt={siteName} sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, objectFit: 'cover' }} />
            ) : (
              <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: accent, color: ink, fontWeight: 800, fontSize: 14 }}>{initials(siteName)}</Box>
            )}
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }} noWrap>{siteName}</Typography>
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
        {/* Навигация по страницам сайта клуба (видна, если опубликовано больше одной) */}
        {navItems.length > 1 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={0.5} sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 1, md: 3 }, overflowX: 'auto' }}>
              {navItems.map((p) => {
                const isCur = p.slug === current;
                return (
                  <Button
                    key={p.slug}
                    component={RouterLink}
                    to={p.slug === 'home' ? `/c/${club.slug}` : `/c/${club.slug}/${p.slug}`}
                    disableRipple
                    sx={{
                      minWidth: 'auto', px: 1.5, py: 1.25, borderRadius: 0, flexShrink: 0, fontWeight: 600,
                      color: isCur ? accent : 'text.secondary',
                      borderBottom: '2px solid', borderColor: isCur ? accent : 'transparent',
                      '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                    }}
                  >
                    {t(p.labelKey, p.fallback)}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      {current !== 'home' ? (
        /* ── Отдельная страница (О нас / Тренеры / Успехи) из блоков ── */
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 5, md: 7 } }}>
          <Typography component="h1" variant="h3" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, mb: 1 }}>
            {currentPage?.title || t(currentMeta?.labelKey || '', currentMeta?.fallback || '')}
          </Typography>
          {currentPage ? <PageRenderer blocks={currentPage.blocks} maxWidth={980} /> : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>{t('clubSite.pageEmpty', 'This page has no content yet.')}</Typography>
          )}
        </Box>
      ) : (
      <>
      {/* Hero */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 60% at 20% 0%, ${accent}22, transparent 70%)` }} />
        <Box sx={{ position: 'relative', maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 7, md: 11 } }}>
          {club.city && <Chip icon={<PlaceRoundedIcon />} label={club.city} sx={{ mb: 3, bgcolor: `${accent}14`, color: accent, fontWeight: 700, '& .MuiChip-icon': { color: accent } }} />}
          <Typography component="h1" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.03, fontSize: { xs: '2.6rem', md: '4rem' }, maxWidth: 16 + 'ch' }}>
            {siteName}
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: 'text.secondary', maxWidth: 560 }}>
            {heroSubtitle}
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
            {/* Вторичный CTA — к реальному разделу этого сайта, а не на /puzzles за логином. */}
            {coaches.length > 0 && (
              <Button size="large" component="a" href="#coaches" variant="outlined" color="inherit" sx={{ px: 4, py: 1.5, borderRadius: 3, color: 'text.primary', borderColor: 'divider' }}>
                {t('clubSite.meetCoaches', 'Meet the coaches')}
              </Button>
            )}
          </Stack>

          {/* Факты клуба — только ненулевые */}
          {heroFacts.length > 0 && (
            <Stack direction="row" spacing={{ xs: 3, md: 6 }} sx={{ mt: 6, flexWrap: 'wrap' }}>
              {heroFacts.map((f) => (
                <Box key={f.label}><Typography sx={{ fontFamily: '"Unbounded"', fontWeight: 800, fontSize: '1.8rem', color: accent, lineHeight: 1 }}>{f.value}</Typography><Typography variant="body2" color="text.secondary">{f.label}</Typography></Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Кастомная страница home из блоков (шаг 3): показывается, если владелец её опубликовал. */}
      {pages.home && <PageRenderer blocks={pages.home.blocks} />}

      {/* Тренеры */}
      {coaches.length > 0 && (
        <Box id="coaches" sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 6, md: 9 }, scrollMarginTop: '80px' }}>
          <Typography variant="overline" sx={{ color: accent, fontWeight: 700 }}>{t('clubSite.ourCoaches', 'Our coaches')}</Typography>
          <Typography variant="h4" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, mb: 3 }}>{t('clubSite.coachesTitle', 'Who will teach you')}</Typography>
          <Grid container spacing={2.5}>
            {coaches.map((c, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Stack direction="row" spacing={1.75} alignItems="center">
                    <Avatar sx={{ width: 48, height: 48, bgcolor: `${accent}1A`, color: accent, fontWeight: 700 }}>{initials(c.name)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {c.title && c.title !== 'None' && <Chip label={c.title} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${accent}14`, color: accent }} />}
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
      </>
      )}

      {/* CTA + футер платформы */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4 }}>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {settings.footer?.text || siteName} · {t('clubSite.poweredBy', 'powered by')} <Box component={RouterLink} to="/" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>debiut</Box>
          </Typography>
          {!membership && (
            <Button component={RouterLink} to={`/register?club=${club.slug}`} variant="contained" sx={{ bgcolor: accent, color: ink, borderRadius: 2.5, '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' } }}>{t('clubSite.join', 'Join the club')}</Button>
          )}
        </Box>
      </Box>
    </Box>
    </ThemeProvider>
  );
};

export default ClubSitePage;
