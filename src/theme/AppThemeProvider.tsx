import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';
import { theme } from './theme';
import { tokens } from './tokens';

// antd (уведомления, календарь, часть форм) — в той же палитре, что и MUI
const antdConfig: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: tokens.accent.gold,
    colorSuccess: tokens.accent.emerald,
    colorError: tokens.accent.red,
    colorInfo: tokens.accent.blue,
    colorBgBase: tokens.bg.canvas,
    colorBgContainer: tokens.bg.surface,
    colorBgElevated: tokens.bg.raised,
    colorBorder: tokens.border.default,
    colorBorderSecondary: tokens.border.subtle,
    colorText: tokens.text.primary,
    colorTextSecondary: tokens.text.secondary,
    borderRadius: tokens.radius.sm,
    fontFamily: tokens.font.sans,
  },
};

// Статические notification.*/message.* не видят контекст ConfigProvider — тема для них отдельно
ConfigProvider.config({
  holderRender: (children: React.ReactNode) => <ConfigProvider theme={antdConfig}>{children}</ConfigProvider>,
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <ConfigProvider theme={antdConfig}>
      <CssBaseline enableColorScheme />
      {children}
    </ConfigProvider>
  </ThemeProvider>
);
