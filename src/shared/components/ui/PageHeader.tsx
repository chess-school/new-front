import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Надпись над заголовком (раздел), янтарная */
  eyebrow?: React.ReactNode;
  /** Кнопки справа (на телефоне — под заголовком) */
  actions?: React.ReactNode;
  /** Компактно (шахматные страницы): одна строка, чтобы доска помещалась в экран */
  dense?: boolean;
}

/** Заголовок страницы — один стиль на всей платформе */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, eyebrow, actions, dense = false }) => dense ? (
  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: { xs: 1.5, md: 2 }, minHeight: 40 }}>
    <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="h1" noWrap sx={{ fontWeight: 700 }}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', md: 'block' } }}>{subtitle}</Typography>}
    </Stack>
    {actions && <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>{actions}</Stack>}
  </Stack>
) : (
  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between"
    spacing={2} sx={{ mb: { xs: 2.5, md: 4 } }}>
    <Box sx={{ minWidth: 0 }}>
      {eyebrow && <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 0.5 }}>{eyebrow}</Typography>}
      <Typography variant="h3" component="h1">{title}</Typography>
      {subtitle && <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>{subtitle}</Typography>}
    </Box>
    {actions && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>{actions}</Stack>}
  </Stack>
);

/** Контейнер страницы: единые поля и максимальная ширина */
export const PageContainer: React.FC<{ children: React.ReactNode; maxWidth?: number | string; dense?: boolean }> = ({ children, maxWidth = 1360, dense = false }) => (
  <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: dense ? { xs: 1.5, md: 2 } : { xs: 2.5, md: 4 }, maxWidth, mx: 'auto', width: '100%', boxSizing: 'border-box' }}>
    {children}
  </Box>
);
