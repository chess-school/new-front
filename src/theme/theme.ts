import { alpha, createTheme, Theme } from '@mui/material/styles';
import { glassFor, tokensFor, ThemeMode, lightTokens } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    surface: { canvas: string; surface: string; raised: string; overlay: string };
  }
  interface PaletteOptions {
    surface?: { canvas: string; surface: string; raised: string; overlay: string };
  }
}

/** Строит тему MUI для выбранного режима (light «Ivory & Ink» / dark «Concept A»). */
export const buildTheme = (mode: ThemeMode): Theme => {
  const t = tokensFor(mode);
  const glass = glassFor(t);
  const isDark = mode === 'dark';
  const inkAlpha = (a: number) => (isDark ? `rgba(255,255,255,${a})` : `rgba(21,18,13,${a})`);

  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent.gold, light: t.accent.goldHover, dark: t.accent.goldDark, contrastText: t.contrastOnAccent },
      secondary: { main: t.accent.emerald, contrastText: '#FFFFFF' },
      success: { main: t.accent.emerald },
      error: { main: t.accent.red },
      warning: { main: isDark ? '#D29922' : '#B45309' },
      info: { main: t.accent.blue },
      background: { default: t.bg.canvas, paper: t.bg.surface },
      surface: t.bg,
      text: { primary: t.text.primary, secondary: t.text.secondary, disabled: t.text.muted },
      divider: t.border.subtle,
      action: {
        hover: inkAlpha(isDark ? 0.05 : 0.04),
        selected: alpha(t.accent.gold, isDark ? 0.14 : 0.08),
        disabledBackground: inkAlpha(0.06),
      },
    },
    shape: { borderRadius: t.radius.md },
    typography: {
      fontFamily: t.font.sans,
      h1: { fontFamily: t.font.display, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.08, fontSize: 'clamp(2.25rem, 4vw + 1rem, 3.5rem)' },
      h2: { fontFamily: t.font.display, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, fontSize: 'clamp(1.9rem, 3vw + 1rem, 2.75rem)' },
      h3: { fontFamily: t.font.display, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.15, fontSize: 'clamp(1.5rem, 2vw + 1rem, 2.25rem)' },
      h4: { fontFamily: t.font.display, fontWeight: 600, letterSpacing: '-0.01em', fontSize: 'clamp(1.35rem, 1.5vw + 0.9rem, 1.85rem)' },
      h5: { fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontWeight: 600, fontSize: '1.05rem' },
      subtitle1: { color: t.text.secondary },
      body2: { lineHeight: 1.55 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      overline: { fontWeight: 600, letterSpacing: '0.08em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: {
            backgroundColor: t.bg.canvas,
            color: t.text.primary,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '::selection': { backgroundColor: alpha(t.accent.gold, isDark ? 0.3 : 0.18) },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: inkAlpha(isDark ? 0.12 : 0.2),
            borderRadius: 8,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          a: { color: t.accent.gold },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: t.bg.surface, border: `1px solid ${t.border.subtle}` },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { borderRadius: t.radius.md, transition: 'border-color .2s ease, transform .2s ease, box-shadow .2s ease' },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
        styleOverrides: { root: { ...glass, borderWidth: '0 0 1px 0', borderRadius: 0 } },
      },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: t.bg.surface, borderRadius: 0 } } },
      MuiMenu: { styleOverrides: { paper: { ...glass, borderRadius: t.radius.md } } },
      MuiPopover: { styleOverrides: { paper: { ...glass, borderRadius: t.radius.md } } },
      MuiDialog: {
        styleOverrides: {
          paper: { ...glass, backgroundColor: isDark ? 'rgba(18, 24, 38, 0.92)' : 'rgba(255, 255, 255, 0.95)', borderRadius: t.radius.lg },
        },
      },
      MuiBackdrop: {
        styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: isDark ? 'rgba(1, 4, 9, 0.6)' : 'rgba(21, 18, 13, 0.4)', backdropFilter: 'blur(4px)' } } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: t.radius.sm, paddingInline: 16 },
          containedPrimary: { '&:hover': { backgroundColor: t.accent.goldHover } },
          outlined: { borderColor: t.border.default, '&:hover': { borderColor: t.border.strong, backgroundColor: inkAlpha(0.04) } },
          outlinedInherit: { borderColor: t.border.default },
          sizeLarge: { paddingBlock: 10, fontSize: '1rem' },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: t.radius.sm } } },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderColor: t.border.subtle,
            color: t.text.secondary,
            '&.Mui-selected': { color: t.accent.gold, backgroundColor: t.accent.goldSoft, '&:hover': { backgroundColor: alpha(t.accent.gold, 0.2) } },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 3, borderRadius: 3, backgroundColor: t.accent.gold },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { minHeight: 44, textTransform: 'none', fontWeight: 600, color: t.text.secondary, '&.Mui-selected': { color: t.text.primary } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 500 }, outlined: { borderColor: t.border.default } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: t.bg.raised,
            borderRadius: t.radius.sm,
            transition: 'border-color .18s ease, box-shadow .18s ease',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.border.default },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.border.strong },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(t.accent.gold, 0.18)}` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: t.accent.gold, borderWidth: 1.5 },
            '& input::placeholder, & textarea::placeholder': { color: t.text.secondary, opacity: 0.9 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { color: t.text.secondary, '&.Mui-focused': { color: t.accent.gold } } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: '#1A2234', color: '#EEF1F7', fontSize: '0.8rem', borderRadius: 6 },
          arrow: { color: '#1A2234' },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { height: 8, borderRadius: 8, backgroundColor: inkAlpha(0.08) }, bar: { borderRadius: 8 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: t.border.subtle },
          head: { color: t.text.secondary, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: t.radius.sm,
            '&.Mui-selected': { backgroundColor: t.accent.goldSoft, color: t.accent.gold, '& .MuiListItemIcon-root': { color: t.accent.gold } },
          },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 38, color: t.text.secondary } } },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: t.radius.md, border: `1px solid ${t.border.subtle}` } },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: t.accent.gold }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: t.accent.gold } },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: t.border.subtle } } },
      MuiBottomNavigation: { styleOverrides: { root: { ...glass, borderWidth: '1px 0 0 0', height: 60 } } },
      MuiBottomNavigationAction: { styleOverrides: { root: { color: t.text.secondary, '&.Mui-selected': { color: t.accent.gold } } } },
    },
  });
};

/** Дефолтная тема (светлая) — для прямых импортов. */
export const theme = buildTheme(lightTokens.mode);
