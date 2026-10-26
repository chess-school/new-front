import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthForm } from '@/components/AuthForm';
import './styles.scss';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const mode = location.pathname.includes('register') ? 'register' : 'login';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, minHeight: '100dvh' }}>
      {/* Левая брендовая панель — только на десктопе */}
      <Box className="grain" sx={{
        position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', justifyContent: 'space-between', p: 7,
        background: 'radial-gradient(80% 60% at 20% 10%, rgba(138,43,43,0.18), transparent 60%), #0C0F14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Box className="aurora" />
        <Box className="chess-grid" />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #F0C65A, #B88A2E)', color: '#090B0E', fontSize: 24, fontWeight: 800 }}>♞</Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('common.brand')}</Typography>
        </Stack>

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h2" sx={{ fontSize: { md: '3rem', lg: '3.6rem' }, lineHeight: 1.05 }}>
            {t('auth.promoTitleLead', 'Think deeper.')}{' '}
            <Box component="span" className="text-foil">{t('auth.promoTitleAccent', 'Play sharper.')}</Box>
          </Typography>
          <Typography sx={{ mt: 2.5, color: 'rgba(243,244,246,0.75)', fontSize: '1.1rem', maxWidth: 440, lineHeight: 1.6 }}>
            {t('auth.promoSubtitle', 'Train with titled coaches, solve tactics and track your rating — all inside one academy.')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={4} sx={{ position: 'relative', zIndex: 2 }}>
          {[
            { v: t('homePage.stats.coachesValue', 'GM & IM'), l: t('homePage.stats.coachesLabel', 'titled coaches') },
            { v: t('homePage.stats.puzzlesValue', '50k+'), l: t('homePage.stats.puzzlesLabel', 'tactics') },
            { v: t('homePage.stats.ratingValue', '+250'), l: t('homePage.stats.ratingLabel', 'avg. gain') },
          ].map((s, i) => (
            <Box key={i}>
              <Typography sx={{ fontFamily: '"Syne"', fontWeight: 800, fontSize: '1.6rem', color: 'primary.main', lineHeight: 1 }}>{s.v}</Typography>
              <Typography variant="caption" color="text.secondary">{s.l}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Правая панель — форма на чистом фоне */}
      <Box className="auth-page-wrapper auth-page-wrapper--split">
        <AuthForm mode={mode} />
      </Box>
    </Box>
  );
};
