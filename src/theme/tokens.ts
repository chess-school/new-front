// Дизайн-токены платформы: тёмная графитовая палитра, янтарный акцент, изумрудные ходы.
// Компоненты берут цвета из темы MUI (theme.palette.*); прямой импорт токенов — для мест вне
// темы (react-chessboard, SVG, antd), где sx/palette недоступны.

export const tokens = {
  bg: {
    /** Фон приложения */
    canvas: '#0d1117',
    /** Карточки, панели */
    surface: '#161b22',
    /** Поднятые элементы: поля ввода, строки при наведении */
    raised: '#1c2128',
    /** Самый светлый слой: выделенная строка, активный ход */
    overlay: '#262c36',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    primary: '#f0f6fc',
    secondary: '#8b949e',
    muted: '#6e7681',
  },
  accent: {
    /** Золотисто-янтарный — главные действия, оценка движка */
    gold: '#e3b341',
    goldHover: '#f0c453',
    goldSoft: 'rgba(227, 179, 65, 0.14)',
    /** Изумрудный — верные ходы, успех */
    emerald: '#3fb950',
    emeraldSoft: 'rgba(63, 185, 80, 0.14)',
    /** Мягкий красный — ошибки, отрицательная оценка */
    red: '#f85149',
    redSoft: 'rgba(248, 81, 73, 0.14)',
    blue: '#58a6ff',
    blueSoft: 'rgba(88, 166, 255, 0.14)',
  },
  board: {
    light: '#ebecd0',
    dark: '#779556',
    /** Последний ход / выбранная клетка */
    highlight: 'rgba(227, 179, 65, 0.45)',
  },
  /** Шкала оценки: бежевые белые, угольные чёрные */
  evalBar: {
    white: '#f2ede4',
    black: '#2b2b2b',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  font: {
    sans: '"Inter", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
} as const;

/** Стекло для выплывающих панелей (меню, диалоги, поповеры) */
export const glass = {
  backgroundColor: 'rgba(22, 27, 34, 0.72)',
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  border: `1px solid ${tokens.border.subtle}`,
} as const;
