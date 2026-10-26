import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';
import { buildTheme } from './theme';
import { tokensFor, ThemeMode } from './tokens';

const STORAGE_KEY = 'mob-theme';

const getInitialMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* SSR / disabled storage */ }
  return 'light';
};

interface ColorModeCtx {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}
const ColorModeContext = createContext<ColorModeCtx>({ mode: 'light', toggle: () => {}, setMode: () => {} });

/** Доступ к текущему режиму и переключению темы из любого компонента. */
export const useColorMode = () => useContext(ColorModeContext);

const antdConfigFor = (mode: ThemeMode): ThemeConfig => {
  const t = tokensFor(mode);
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: t.accent.gold,
      colorSuccess: t.accent.emerald,
      colorError: t.accent.red,
      colorInfo: t.accent.blue,
      colorBgBase: t.bg.canvas,
      colorBgContainer: t.bg.surface,
      colorBgElevated: t.bg.raised,
      colorBorder: t.border.default,
      colorBorderSecondary: t.border.subtle,
      colorText: t.text.primary,
      colorTextSecondary: t.text.secondary,
      borderRadius: t.radius.sm,
      fontFamily: t.font.sans,
    },
  };
};

// Статические notification.*/message.* не видят контекст ConfigProvider — тема для них отдельно.
// Обновляется при каждой смене режима.
const applyStaticAntd = (mode: ThemeMode) => {
  const cfg = antdConfigFor(mode);
  ConfigProvider.config({
    holderRender: (children: React.ReactNode) => <ConfigProvider theme={cfg}>{children}</ConfigProvider>,
  });
};

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const antdConfig = useMemo(() => antdConfigFor(mode), [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0A0E16' : '#F3F4F7');
    applyStaticAntd(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), []);

  const ctx = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return (
    <ColorModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <ConfigProvider theme={antdConfig}>
          <CssBaseline enableColorScheme />
          {children}
        </ConfigProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
