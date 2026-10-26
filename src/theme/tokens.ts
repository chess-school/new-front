// Дизайн-токены платформы «debiut» в ДВУХ режимах: светлый (канвас #F3F4F7, синий акцент)
// и тёмный (канвас #0A0E16, синий акцент). Компоненты берут цвета из темы MUI
// (theme.palette.*); прямой импорт токенов — для мест вне темы (react-chessboard, SVG, antd).
// Примечание: ключ accent.gold — ИСТОРИЧЕСКИЙ, в нём хранится ГЛАВНЫЙ акцент режима
// (теперь — королевский синий debiut). Переименование ключа отложено, чтобы не трогать
// десятки точек использования разом.

export type ThemeMode = 'light' | 'dark';

// Общие для обоих режимов
const radius = { sm: 8, md: 12, lg: 16, xl: 22 } as const;
const font = {
  sans: '"Plus Jakarta Sans", "Inter", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif',
  display: '"Space Grotesk", "Plus Jakarta Sans", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

// ── Светлый ────────────────────────────────────────────────────────────
export const lightTokens = {
  mode: 'light' as ThemeMode,
  bg: { canvas: '#F3F4F7', surface: '#FFFFFF', raised: '#F8F9FC', overlay: '#ECEFF4' },
  border: { subtle: 'rgba(20, 27, 46, 0.08)', default: 'rgba(20, 27, 46, 0.14)', strong: 'rgba(20, 27, 46, 0.24)' },
  text: { primary: '#141B2E', secondary: '#5B6478', muted: '#8A93A6' },
  accent: {
    gold: '#2B50E0', goldHover: '#3A5FF0', goldDark: '#1E3CB0', goldSoft: 'rgba(43, 80, 224, 0.08)',
    emerald: '#16A34A', emeraldSoft: 'rgba(22, 163, 74, 0.10)',
    red: '#DC2626', redSoft: 'rgba(220, 38, 38, 0.10)',
    blue: '#3B82F6', blueSoft: 'rgba(59, 130, 246, 0.10)',
    amber: '#B8862F', amberSoft: 'rgba(184, 134, 47, 0.12)',
  },
  board: { light: '#EEF1F8', dark: '#7D8CB0', highlight: 'rgba(43, 80, 224, 0.38)' },
  evalBar: { white: '#EEF1F8', black: '#2A3347' },
  contrastOnAccent: '#FFFFFF',
  radius, font,
} as const;

// ── Тёмный ─────────────────────────────────────────────────────────────
export const darkTokens = {
  mode: 'dark' as ThemeMode,
  bg: { canvas: '#0A0E16', surface: '#121826', raised: '#1A2234', overlay: '#222C42' },
  border: { subtle: 'rgba(255, 255, 255, 0.07)', default: '#232C3E', strong: 'rgba(255, 255, 255, 0.18)' },
  text: { primary: '#EEF1F7', secondary: '#9AA5BC', muted: '#64708A' },
  accent: {
    gold: '#4C6FFF', goldHover: '#6B88FF', goldDark: '#3350D0', goldSoft: 'rgba(76, 111, 255, 0.16)',
    emerald: '#22C55E', emeraldSoft: 'rgba(34, 197, 94, 0.15)',
    red: '#F0564A', redSoft: 'rgba(240, 86, 74, 0.15)',
    blue: '#58A6FF', blueSoft: 'rgba(88, 166, 255, 0.14)',
    amber: '#D6A33A', amberSoft: 'rgba(214, 163, 58, 0.16)',
  },
  board: { light: '#E7EBF3', dark: '#5A688C', highlight: 'rgba(76, 111, 255, 0.45)' },
  evalBar: { white: '#E7EBF3', black: '#2A3347' },
  contrastOnAccent: '#FFFFFF',
  radius, font,
} as const;

export type Tokens = typeof lightTokens;

export const tokensFor = (mode: ThemeMode): Tokens => (mode === 'dark' ? (darkTokens as unknown as Tokens) : lightTokens);

/** Дефолтный набор для статических импортов вне темы (светлый) */
export const tokens = lightTokens;

/** Стекло для выплывающих панелей — зависит от режима */
export const glassFor = (t: Tokens) => ({
  backgroundColor: t.mode === 'dark' ? 'rgba(18, 24, 38, 0.74)' : 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(16px) saturate(130%)',
  WebkitBackdropFilter: 'blur(16px) saturate(130%)',
  border: `1px solid ${t.border.subtle}`,
});

/** Дефолтное стекло (светлое) — для статических импортов */
export const glass = glassFor(lightTokens);
