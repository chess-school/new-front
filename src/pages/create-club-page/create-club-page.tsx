import { useContext, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Grid, Paper, Stack, Stepper, Step, StepLabel, TextField,
  Radio, Chip,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { createClub as createClubApi } from '@/features/clubs/clubsApi';
import { useClubStore } from '@/features/clubs/clubStore';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';

// Языки сайта: Polski / English / Українська. RU-локализации нет — не добавлять.
const BRAND_COLORS = ['#2B50E0', '#7C3AED', '#0EA5E9', '#16A34A', '#DC2626', '#B8862F', '#DB2777', '#0F766E'];

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9Ѐ-ӿ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);

export const CreateClubPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const [plan, setPlan] = useState<'start' | 'club' | 'academy'>('club');

  const slug = useMemo(() => slugify(name) || 'my-club', [name]);

  const steps = [
    t('onboard.step1', 'Club'),
    t('onboard.step2', 'Branding'),
    t('onboard.step3', 'Plan'),
  ];

  const plans = [
    { key: 'club' as const, name: 'Klub', tagline: t('land.pricing.clubTagline', 'For a club with several groups'), popular: true },
    { key: 'start' as const, name: 'Start', tagline: t('land.pricing.startTagline', 'For a trainer or a small school'), popular: false },
    { key: 'academy' as const, name: 'Akademia', tagline: t('land.pricing.academyTagline', 'For school networks and federations'), popular: false },
  ];

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogo(URL.createObjectURL(file));
  };

  const canNext = active === 0 ? name.trim().length >= 2 : true;

  const next = async () => {
    if (active < steps.length - 1) { setActive((s) => s + 1); return; }
    // Пользователь уже вошёл — создаём клуб сразу и ведём в консоль
    if (auth?.isAuthenticated) {
      setSubmitting(true);
      try {
        const club = await createClubApi({ name, slug, city, plan, brand: { primaryColor: color } });
        try { localStorage.setItem('debiut.activeClub', club._id); } catch { /* ignore */ }
        useClubStore.getState().reset();
        navigate('/club');
      } catch {
        setSubmitting(false); // ошибку покажет общий перехватчик axios
      }
      return;
    }
    // Гость — сохраняем черновик и ведём к созданию аккаунта владельца
    try {
      localStorage.setItem('debiut.clubDraft', JSON.stringify({ name, slug, city, color, plan }));
    } catch { /* ignore quota */ }
    setDone(true);
  };

  const LogoPreview = ({ size = 56 }: { size?: number }) => (
    logo
      ? <Box component="img" src={logo} alt="" sx={{ width: size, height: size, borderRadius: 2.5, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />
      : <Box sx={{ width: size, height: size, borderRadius: 2.5, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', fontSize: size * 0.42, fontWeight: 800 }}>
          {(name.trim()[0] || '♞').toUpperCase()}
        </Box>
  );

  if (done) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <PageContainer>
          <Paper sx={{ maxWidth: 520, mx: 'auto', p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 64, color: 'success.main' }} />
            <Typography variant="h4" sx={{ mt: 2 }}>{t('onboard.doneTitle', 'Your club is ready to launch')}</Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ my: 3 }}>
              <LogoPreview />
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700 }}>{name || 'My club'}</Typography>
                <Typography variant="body2" color="text.secondary">debiut.app/{slug}</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('onboard.doneDesc', 'Create your owner account to finish setup — invite trainers and students, and run your first lesson tonight.')}
            </Typography>
            <Button variant="contained" size="large" component={RouterLink} to="/register" endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 2.5 }}>
              {t('onboard.createAccount', 'Create owner account')}
            </Button>
          </Paper>
        </PageContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <SEOHead title={t('onboard.seoTitle', 'Create a chess club — debiut')} description={t('onboard.seoDesc', 'Set up your chess club on debiut in three moves: name and branding, pick a plan, invite your team.')} noindex />
      <PageContainer>
        <Box sx={{ maxWidth: 720, mx: 'auto', py: { xs: 5, md: 8 } }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{t('land.nav.createClub', 'Create a club')}</Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 4 }}>{t('onboard.title', 'Set up your club in three moves')}</Typography>

          <Stepper activeStep={active} sx={{ mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            {active === 0 && (
              <Stack spacing={3}>
                <TextField label={t('onboard.clubName', 'Club name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus
                  placeholder="SKS Hetman Poznań" helperText={name ? `debiut.app/${slug}` : t('onboard.slugHint', 'Your club address is generated from the name')} />
                <TextField label={t('onboard.city', 'City / address')} value={city} onChange={(e) => setCity(e.target.value)} fullWidth placeholder="Poznań" />
              </Stack>
            )}

            {active === 1 && (
              <Stack spacing={3.5}>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{t('onboard.logo', 'Club logo')}</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <LogoPreview size={64} />
                    <Button component="label" variant="outlined" color="inherit" startIcon={<CloudUploadRoundedIcon />} sx={{ borderColor: 'divider', color: 'text.primary', borderRadius: 2 }}>
                      {t('onboard.uploadLogo', 'Upload logo')}
                      <input type="file" accept="image/*" hidden onChange={onLogo} />
                    </Button>
                  </Stack>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{t('onboard.brandColor', 'Brand color')}</Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    {BRAND_COLORS.map((c) => (
                      <Box key={c} onClick={() => setColor(c)} role="button" aria-label={c}
                        sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: c, cursor: 'pointer', boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none', transition: 'box-shadow .15s' }} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}

            {active === 2 && (
              <Stack spacing={1.5}>
                {plans.map((p) => (
                  <Paper key={p.key} onClick={() => setPlan(p.key)} role="button"
                    sx={{
                      p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                      border: '2px solid', borderColor: plan === p.key ? 'primary.main' : 'divider',
                      bgcolor: plan === p.key ? 'rgba(43,80,224,0.05)' : 'background.paper',
                    }}>
                    <Radio checked={plan === p.key} />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>
                        {p.popular && <Chip label={t('land.pricing.popular', 'Most popular')} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: 'primary.main', color: '#fff' }} />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{p.tagline}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}

            <Grid container sx={{ mt: 4 }} alignItems="center">
              <Grid item xs={6}>
                {active > 0 && (
                  <Button color="inherit" startIcon={<ArrowBackRoundedIcon />} onClick={() => setActive((s) => s - 1)} sx={{ color: 'text.secondary' }}>
                    {t('onboard.back', 'Back')}
                  </Button>
                )}
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Button variant="contained" onClick={next} disabled={!canNext || submitting} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 2.5, px: 3 }}>
                  {active === steps.length - 1 ? t('onboard.finish', 'Create club') : t('onboard.continue', 'Continue')}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            {t('onboard.hasAccount', 'Already have a club?')} <Button component={RouterLink} to="/login" size="small" sx={{ fontWeight: 600 }}>{t('land.nav.login', 'Log in')}</Button>
          </Typography>
        </Box>
      </PageContainer>
    </Box>
  );
};
