import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthForm } from '@/components/AuthForm';
import { useSiteSettings } from '@/features/site/SiteSettingsContext';
import './styles.scss';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const site = useSiteSettings();
  const mode = location.pathname.includes('register') ? 'register' : 'login';

  // Бренд/тексты берём из настроек активного клуба; пустое — нейтральные дефолты платформы (debiut).
  const brandName = site.siteName || t('common.brand', 'debiut');
  const promoTitle = site.auth.promoTitle || t('auth.promoTitle', 'Train. Compete. Improve.');
  const promoSubtitle = site.auth.promoSubtitle
    || t('auth.promoSubtitle', 'Lessons, puzzles and online games — all inside one platform.');
  const facts = site.auth.facts; // пусто → блок цифр скрыт (никаких выдуманных значений)
  const accent = site.primaryColor;
  const bg = site.auth.backgroundUrl;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, minHeight: '100dvh' }}>
      {/* Левая брендовая панель — только на десктопе */}
      <Box className="grain" sx={{
        position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', justifyContent: 'space-between', p: 7,
        background: bg
          ? `linear-gradient(rgba(12,15,20,0.55), rgba(12,15,20,0.75)), url(${bg}) center/cover no-repeat`
          : `radial-gradient(80% 60% at 20% 10%, ${accent}2E, transparent 60%), #0C0F14`,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Box className="aurora" />
        <Box className="chess-grid" />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          {site.logoUrl ? (
            <Box component="img" src={site.logoUrl} alt={brandName} sx={{ width: 40, height: 40, borderRadius: 2, objectFit: 'cover' }} />
          ) : (
            <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', background: accent, color: '#fff', fontSize: 24, fontWeight: 800 }}>♞</Box>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{brandName}</Typography>
        </Stack>

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h2" sx={{ fontSize: { md: '3rem', lg: '3.6rem' }, lineHeight: 1.05 }}>
            {promoTitle}
          </Typography>
          <Typography sx={{ mt: 2.5, color: 'rgba(243,244,246,0.75)', fontSize: '1.1rem', maxWidth: 440, lineHeight: 1.6 }}>
            {promoSubtitle}
          </Typography>
        </Box>

        {facts.length > 0 ? (
          <Stack direction="row" spacing={4} sx={{ position: 'relative', zIndex: 2 }}>
            {facts.map((s, i) => (
              <Box key={i}>
                <Typography sx={{ fontFamily: '"Syne"', fontWeight: 800, fontSize: '1.6rem', color: 'primary.main', lineHeight: 1 }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ position: 'relative', zIndex: 2 }} />
        )}
      </Box>

      {/* Правая панель — форма на чистом фоне */}
      <Box className="auth-page-wrapper auth-page-wrapper--split">
        <AuthForm mode={mode} />
      </Box>
    </Box>
  );
};
