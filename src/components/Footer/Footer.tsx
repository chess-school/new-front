import { Box, Typography, Link, Button, Stack } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1A1A1A',
        color: '#CCCCCC',
        padding: '2rem',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1.5rem',
      }}
    >
      {/* О нашей школе */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          {t('footer.brand')}
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: '1rem' }}>
          {t('footer.tagline')}
        </Typography>
        <Stack spacing={1}>
          <Link href="/courses" underline="hover" sx={{ color: '#007BFF' }}>
            {t('footer.popularCourses')}
          </Link>
          <Link href="/reviews" underline="hover" sx={{ color: '#007BFF' }}>
            {t('footer.reviews')}
          </Link>
          <Link href="/coaches" underline="hover" sx={{ color: '#007BFF' }}>
            {t('footer.ourCoaches')}
          </Link>
        </Stack>
      </Box>

      {/* Юридическая информация */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          {t('footer.legal')}
        </Typography>
        <Stack spacing={1}>
          <Link href="/privacy-policy" underline="hover" sx={{ color: '#007BFF' }}>
            {t('footer.privacyPolicy')}
          </Link>
          <Link href="/terms-of-use" underline="hover" sx={{ color: '#007BFF' }}>
            {t('footer.termsOfUse')}
          </Link>
        </Stack>
        <Typography variant="body2" sx={{ marginTop: '1rem' }}>
          {t('footer.copyright', { year: 2025 })}
        </Typography>
      </Box>

      {/* Социальные сети */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          {t('footer.social')}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ marginBottom: '1rem' }}>
          <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <FacebookIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#1877F2' } }} />
          </Link>
          <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <InstagramIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#E4405F' } }} />
          </Link>
          <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <TwitterIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#1DA1F2' } }} />
          </Link>
        </Stack>
        <Button
          href="/contact"
          variant="contained"
          sx={{
            backgroundColor: '#007BFF',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '20px',
            fontSize: '0.9rem',
            padding: '0.5rem 1.5rem',
            '&:hover': {
              backgroundColor: '#0056b3',
            },
          }}
        >
          {t('footer.contactUs')}
        </Button>
      </Box>
    </Box>
  );
};
