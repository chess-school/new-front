import { Box, Typography, Button, Grid, Paper, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';

export const PricingPage = () => {
  const { t } = useTranslation();

  const plans = [
    {
      key: 'start', name: 'Start', tagline: t('land.pricing.startTagline', 'For a trainer or a small school'),
      popular: false, custom: false, cta: t('land.pricing.chooseStart', 'Choose Start'),
      points: [
        t('land.pricing.start1', 'Up to 30 students, 1 trainer'),
        t('land.pricing.start2', 'Puzzle base and courses'),
        t('land.pricing.start3', 'Online lessons up to 8 people'),
        t('land.pricing.start4', 'Telegram notifications'),
      ],
    },
    {
      key: 'club', name: 'Klub', tagline: t('land.pricing.clubTagline', 'For a club with several groups'),
      popular: true, custom: false, cta: t('land.pricing.chooseClub', 'Choose Klub'),
      points: [
        t('land.pricing.club1', 'Up to 150 students, 10 trainers'),
        t('land.pricing.club2', 'Course builder and grade journal'),
        t('land.pricing.club3', 'Online lessons up to 30 people'),
        t('land.pricing.club4', 'Telegram & WhatsApp, online payments'),
      ],
    },
    {
      key: 'academy', name: 'Akademia', tagline: t('land.pricing.academyTagline', 'For school networks and federations'),
      popular: false, custom: true, cta: t('land.pricing.contact', 'Let’s talk'),
      points: [
        t('land.pricing.academy1', 'No limit on students and branches'),
        t('land.pricing.academy2', 'Own domain and branding'),
        t('land.pricing.academy3', 'Reports for the board'),
        t('land.pricing.academy4', 'Onboarding and support'),
      ],
    },
  ];

  // Таблица сравнения: значение для [Start, Klub, Akademia]
  const compare: { label: string; vals: (string | boolean)[] }[] = [
    { label: t('land.compare.students', 'Students'), vals: ['30', '150', t('land.pricing.custom', 'Custom')] },
    { label: t('land.compare.trainers', 'Trainers'), vals: ['1', '10', '∞'] },
    { label: t('land.compare.lessonSize', 'Online lesson size'), vals: ['8', '30', '∞'] },
    { label: t('land.compare.puzzles', 'Puzzle base & courses'), vals: [true, true, true] },
    { label: t('land.compare.journal', 'Grade journal & statistics'), vals: [false, true, true] },
    { label: t('land.compare.courseBuilder', 'Course builder'), vals: [false, true, true] },
    { label: t('land.compare.telegram', 'Telegram bot'), vals: [true, true, true] },
    { label: t('land.compare.whatsapp', 'WhatsApp bot'), vals: [false, true, true] },
    { label: t('land.compare.payments', 'Online payments'), vals: [false, true, true] },
    { label: t('land.compare.branding', 'Own domain & branding'), vals: [false, false, true] },
    { label: t('land.compare.support', 'Onboarding & priority support'), vals: [false, false, true] },
  ];

  const cell = (v: string | boolean) =>
    typeof v === 'boolean'
      ? (v ? <CheckRoundedIcon sx={{ fontSize: 20, color: 'success.main' }} /> : <CloseRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />)
      : <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{v}</Typography>;

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <SEOHead title={t('land.pricing.seoTitle', 'Pricing — debiut')} description={t('land.pricing.seoDesc', 'debiut pricing plans for chess clubs: Start, Klub and Akademia. You pay for club size, not for features.')} />
      <PageContainer>
        {/* Header */}
        <Box sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 4, md: 6 }, textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{t('land.pricing.eyebrow', 'Pricing')}</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.2rem' }, mt: 1 }}>
            {t('land.pricing.title', 'You pay for club size, not for features')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, fontSize: '1.1rem' }}>
            {t('land.pricing.subtitle', 'Every plan includes the full training toolkit. Start free — no credit card required.')}
          </Typography>
        </Box>

        {/* Plan cards */}
        <Grid container spacing={2.5} alignItems="stretch" sx={{ mb: { xs: 6, md: 9 } }}>
          {plans.map((p) => (
            <Grid item xs={12} md={4} key={p.key}>
              <Paper sx={{
                p: { xs: 3, md: 3.5 }, height: '100%', borderRadius: 4, display: 'flex', flexDirection: 'column',
                bgcolor: 'background.paper', border: '2px solid', borderColor: p.popular ? 'primary.main' : 'divider',
                boxShadow: p.popular ? '0 30px 70px -40px rgba(43,80,224,0.55)' : '0 1px 2px rgba(20,27,46,0.04)',
                position: 'relative',
              }}>
                {p.popular && (
                  <Chip label={t('land.pricing.popular', 'Most popular')} size="small"
                    sx={{ position: 'absolute', top: -13, left: 24, bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: 11 }} />
                )}
                <Typography variant="h5">{p.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.tagline}</Typography>
                <Box sx={{ my: 2.5 }}>
                  <Typography component="span" sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: p.custom ? '1.9rem' : '2.4rem', color: 'text.primary', lineHeight: 1 }}>
                    {p.custom ? t('land.pricing.custom', 'Custom') : t('land.pricing.priceStub', '[PRICE]')}
                  </Typography>
                  {!p.custom && <Typography component="span" color="text.secondary" sx={{ ml: 0.75 }}>{t('land.pricing.perMonth', '/ mo.')}</Typography>}
                </Box>
                <Stack spacing={1.25} sx={{ flexGrow: 1, mb: 3 }}>
                  {p.points.map((pt, idx) => (
                    <Stack key={idx} direction="row" spacing={1.25} alignItems="flex-start">
                      <CheckRoundedIcon sx={{ fontSize: 19, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">{pt}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button fullWidth size="large" component={RouterLink} to="/create-club"
                  variant={p.popular ? 'contained' : 'outlined'} color={p.popular ? 'primary' : 'inherit'}
                  sx={{ borderRadius: 2.5, ...(p.popular ? {} : { borderColor: 'divider', color: 'text.primary' }) }}>
                  {p.cta}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Comparison table */}
        <Box sx={{ mb: { xs: 6, md: 9 } }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: { xs: 3, md: 5 } }}>{t('land.compare.title', 'Compare plans')}</Typography>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('land.compare.feature', 'Feature')}</TableCell>
                    {plans.map((p) => (
                      <TableCell key={p.key} align="center" sx={{ fontWeight: 700, color: p.popular ? 'primary.main' : 'text.primary' }}>{p.name}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compare.map((row) => (
                    <TableRow key={row.label} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.label}</TableCell>
                      {row.vals.map((v, i) => (
                        <TableCell key={i} align="center">{cell(v)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>

        {/* CTA */}
        <Box sx={{
          borderRadius: 6, mb: { xs: 6, md: 9 }, px: { xs: 3, md: 8 }, py: { xs: 6, md: 7 },
          background: 'linear-gradient(135deg, #2B50E0 0%, #1E3CB0 100%)', color: '#fff',
          boxShadow: '0 30px 70px -40px rgba(43,80,224,0.7)',
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ color: '#fff' }}>{t('land.cta.title', 'Your move. Create a club and run your first lesson today.')}</Typography>
              <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.85)' }}>{t('land.cta.subtitle', 'No credit card. You can export your club data at any time.')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Button size="large" component={RouterLink} to="/create-club" endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 4, py: 1.6, fontSize: '1.05rem', borderRadius: 3, bgcolor: '#fff', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
                {t('land.cta.button', 'Create a club for free')}
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Divider sx={{ opacity: 0 }} />
      </PageContainer>
    </Box>
  );
};
