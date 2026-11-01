import { Box, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/shared/components/seo/SEOHead';

/** Страница 404 — вместо прежнего пустого layout с HTTP 200. */
export const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 3 }}>
      <SEOHead title={t('notFound.seoTitle', 'Page not found — debiut')} description="" noindex />
      <Box>
        <Typography sx={{ fontFamily: '"Unbounded", sans-serif', fontWeight: 800, fontSize: { xs: '4rem', md: '6rem' }, lineHeight: 1, color: 'primary.main' }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
          {t('notFound.title', 'This square is empty')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}>
          {t('notFound.subtitle', 'The page you are looking for does not exist or was moved.')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4, justifyContent: 'center' }}>
          <Button component={RouterLink} to="/" variant="contained" sx={{ borderRadius: 2.5 }}>
            {t('notFound.home', 'Back to home')}
          </Button>
          <Button component={RouterLink} to="/puzzles" variant="outlined" color="inherit" sx={{ borderRadius: 2.5, borderColor: 'divider' }}>
            {t('notFound.puzzles', 'Solve a puzzle')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
