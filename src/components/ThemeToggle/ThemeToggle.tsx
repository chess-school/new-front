import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/theme/AppThemeProvider';

/** Тумблер светлой/тёмной темы — состояние хранится в localStorage (mob-theme). */
export const ThemeToggle: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'medium' }) => {
  const { mode, toggle } = useColorMode();
  const { t } = useTranslation();
  const isDark = mode === 'dark';
  const label = isDark ? t('theme.switchToLight', 'Switch to light theme') : t('theme.switchToDark', 'Switch to dark theme');

  return (
    <Tooltip title={label}>
      <IconButton onClick={toggle} aria-label={label} size={size} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
        {isDark ? <LightModeRoundedIcon fontSize={size} /> : <DarkModeRoundedIcon fontSize={size} />}
      </IconButton>
    </Tooltip>
  );
};
