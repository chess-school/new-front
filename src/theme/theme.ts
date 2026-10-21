import { alpha, createTheme } from '@mui/material/styles';
import { glass, tokens } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    surface: { canvas: string; surface: string; raised: string; overlay: string };
  }
  interface PaletteOptions {
    surface?: { canvas: string; surface: string; raised: string; overlay: string };
  }
}

/** Единая тёмная тема платформы (MUI). Стили страниц — через palette/shape, без своих цветов. */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: tokens.accent.gold, light: tokens.accent.goldHover, dark: '#c4972a', contrastText: '#1a1405' },
    secondary: { main: tokens.accent.emerald, contrastText: '#04130a' },
    success: { main: tokens.accent.emerald },
    error: { main: tokens.accent.red },
    warning: { main: '#d29922' },
    info: { main: tokens.accent.blue },
    background: { default: tokens.bg.canvas, paper: tokens.bg.surface },
    surface: tokens.bg,
    text: { primary: tokens.text.primary, secondary: tokens.text.secondary, disabled: tokens.text.muted },
    divider: tokens.border.subtle,
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(227, 179, 65, 0.12)',
      disabledBackground: 'rgba(255, 255, 255, 0.06)',
    },
  },
  shape: { borderRadius: tokens.radius.md },
  typography: {
    fontFamily: tokens.font.sans,
    h1: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: 'clamp(2rem, 4vw + 1rem, 3.25rem)' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: 'clamp(1.75rem, 3vw + 1rem, 2.75rem)' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em', fontSize: 'clamp(1.5rem, 2vw + 1rem, 2.25rem)' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em', fontSize: 'clamp(1.35rem, 1.5vw + 0.9rem, 1.85rem)' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.05rem' },
    subtitle1: { color: tokens.text.secondary },
    body2: { lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    overline: { fontWeight: 600, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { colorScheme: 'dark' },
        body: {
          backgroundColor: tokens.bg.canvas,
          color: tokens.text.primary,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::selection': { backgroundColor: alpha(tokens.accent.gold, 0.3) },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        a: { color: tokens.accent.gold },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: tokens.bg.surface, border: `1px solid ${tokens.border.subtle}` },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          transition: 'border-color .2s ease, transform .2s ease, box-shadow .2s ease',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: { root: { ...glass, borderWidth: '0 0 1px 0', borderRadius: 0 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: tokens.bg.surface, borderRadius: 0 } },
    },
    MuiMenu: { styleOverrides: { paper: { ...glass, borderRadius: tokens.radius.md } } },
    MuiPopover: { styleOverrides: { paper: { ...glass, borderRadius: tokens.radius.md } } },
    MuiDialog: {
      styleOverrides: {
        paper: { ...glass, backgroundColor: 'rgba(22, 27, 34, 0.9)', borderRadius: tokens.radius.lg },
      },
    },
    MuiBackdrop: {
      styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: 'rgba(1, 4, 9, 0.6)', backdropFilter: 'blur(4px)' } } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm, paddingInline: 16 },
        containedPrimary: { '&:hover': { backgroundColor: tokens.accent.goldHover } },
        outlined: { borderColor: tokens.border.default, '&:hover': { borderColor: tokens.border.strong, backgroundColor: 'rgba(255,255,255,0.04)' } },
        outlinedInherit: { borderColor: tokens.border.default },
        sizeLarge: { paddingBlock: 10, fontSize: '1rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: tokens.radius.sm } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderColor: tokens.border.subtle,
          color: tokens.text.secondary,
          '&.Mui-selected': { color: tokens.accent.gold, backgroundColor: tokens.accent.goldSoft, '&:hover': { backgroundColor: alpha(tokens.accent.gold, 0.2) } },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 3, borderRadius: 3, backgroundColor: tokens.accent.gold },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: 'none',
          fontWeight: 600,
          color: tokens.text.secondary,
          '&.Mui-selected': { color: tokens.text.primary },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: { borderColor: tokens.border.default },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.bg.raised,
          borderRadius: tokens.radius.sm,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border.default },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border.strong },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: tokens.bg.overlay, border: `1px solid ${tokens.border.default}`, fontSize: '0.8rem', borderRadius: 6 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
        bar: { borderRadius: 8 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: tokens.border.subtle },
        head: { color: tokens.text.secondary, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          '&.Mui-selected': { backgroundColor: tokens.accent.goldSoft, color: tokens.accent.gold, '& .MuiListItemIcon-root': { color: tokens.accent.gold } },
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 38, color: tokens.text.secondary } } },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: tokens.radius.md, border: `1px solid ${tokens.border.subtle}` } },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { '&.Mui-checked': { color: tokens.accent.gold }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: tokens.accent.gold } },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: tokens.border.subtle } } },
    MuiBottomNavigation: {
      styleOverrides: { root: { ...glass, borderWidth: '1px 0 0 0', height: 60 } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { color: tokens.text.secondary, '&.Mui-selected': { color: tokens.accent.gold } } },
    },
  },
});
