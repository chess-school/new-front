import React, { useEffect } from 'react';
import { Box, Typography, Button, Stack, Grid, Divider } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';

// Логотип debiut (синий квадрат + словесный знак)
const BrandMark = ({ size = 32 }: { size?: number }) => (
  <Stack direction="row" alignItems="center" spacing={1.25} component={RouterLink} to="/"
    sx={{ textDecoration: 'none', color: 'text.primary' }}>
    <Box aria-hidden sx={{ width: size, height: size, borderRadius: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#3A5FF0,#1E3CB0)', color: '#fff', fontSize: size * 0.58, fontWeight: 800 }}>♞</Box>
    <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: size >= 32 ? '1.3rem' : '1.15rem', letterSpacing: '-0.01em' }}>debiut</Typography>
  </Stack>
);

const MarketingNav = () => {
  const { t } = useTranslation();
  const anchors = [
    { key: 'features', label: t('land.nav.features', 'Features'), to: '/#features' },
    { key: 'personas', label: t('land.nav.forWhom', 'For whom'), to: '/#personas' },
    { key: 'pricing', label: t('land.nav.pricing', 'Pricing'), to: '/pricing' },
    { key: 'faq', label: t('land.nav.faq', 'FAQ'), to: '/#faq' },
  ];
  return (
    <Box component="header" sx={{
      position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid', borderColor: 'divider',
      bgcolor: 'rgba(243,244,247,0.78)', backdropFilter: 'blur(14px)',
    }}>
      <PageContainer>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ height: 64 }}>
          <BrandMark />
          <Stack direction="row" spacing={0.5} sx={{ ml: 3, display: { xs: 'none', md: 'flex' } }}>
            {anchors.map((a) => (
              <Button key={a.key} component={RouterLink} to={a.to} color="inherit"
                sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'text.primary', bgcolor: 'transparent' } }}>{a.label}</Button>
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Button component={RouterLink} to="/login" color="inherit" sx={{ color: 'text.primary', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}>{t('land.nav.login', 'Log in')}</Button>
          <Button component={RouterLink} to="/create-club" variant="contained" sx={{ borderRadius: 2.5, px: 2.5 }}>{t('land.nav.createClub', 'Create a club')}</Button>
        </Stack>
      </PageContainer>
    </Box>
  );
};

const MarketingFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return (
    <Box component="footer" sx={{ py: 7, bgcolor: 'surface.overlay', borderTop: '1px solid', borderColor: 'divider' }}>
      <PageContainer>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <BrandMark size={36} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 420 }}>
              {t('land.footer.desc', 'A platform to run your chess club: groups and trainers, courses, online lessons and a progress journal.')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
              <Button component={RouterLink} to="/#features" size="small" color="inherit" sx={{ color: 'text.secondary' }}>{t('land.nav.features', 'Features')}</Button>
              <Button component={RouterLink} to="/pricing" size="small" color="inherit" sx={{ color: 'text.secondary' }}>{t('land.nav.pricing', 'Pricing')}</Button>
              <Button component={RouterLink} to="/#faq" size="small" color="inherit" sx={{ color: 'text.secondary' }}>{t('land.nav.faq', 'FAQ')}</Button>
              <Button component={RouterLink} to="/login" size="small" color="inherit" sx={{ color: 'text.secondary' }}>{t('land.nav.login', 'Log in')}</Button>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" textAlign="center" color="text.disabled">
          © {currentYear} debiut · Polski · English · Українська
        </Typography>
      </PageContainer>
    </Box>
  );
};

/** Маркетинговый каркас для публичных страниц (лендинг, тарифы, онбординг): свой навбар и футер, без app-сайдбара. */
export const MarketingShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Плавный скролл к якорю (#features и т.п.) при переходе с другой страницы
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // даём контенту отрисоваться
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <MarketingNav />
      {children}
      <MarketingFooter />
    </Box>
  );
};

export { BrandMark };
