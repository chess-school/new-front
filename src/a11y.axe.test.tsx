import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { AppThemeProvider } from '@/theme';
import { AuthForm } from '@/components/AuthForm/AuthForm';
import { SolveCard } from '@/features/Classroom/components/SolveCard';
import type { SolveState } from '@/features/Classroom/classroomApi';
import { MarkdownView } from '@/features/CoursePlayer/components/MarkdownView';
import { PuzzleSourceDialogs } from '@/features/CourseBuilder/components/PuzzleSourceDialogs';

// AuthForm дёргает API-модули при сабмите — мокаем, сам сабмит в a11y-прогоне не вызываем.
vi.mock('@/api/login', () => ({ loginUser: vi.fn() }));
vi.mock('@/api/register/register', () => ({ registerUser: vi.fn() }));

const authValue = {
  user: null, loading: false, isAuthenticated: false,
  login: vi.fn(async () => ({} as never)), logout: vi.fn(), refetchUser: vi.fn(async () => {}),
} as never;

const solve = (over: Partial<SolveState> = {}): SolveState => ({
  index: 2, total: 6, startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  sideToMove: 'w', status: 'solving', wrong: 1, hintAt: null, title: 'Mate in 2',
  startedAt: new Date(0).toISOString(), ...over,
});

/** Рендерит узел в заданной теме (light/dark) со всеми провайдерами и прогоняет axe. */
const renderInTheme = (mode: 'light' | 'dark', node: React.ReactNode) => {
  localStorage.setItem('mob-theme', mode);
  return render(
    <AuthContext.Provider value={authValue}>
      <AppThemeProvider>
        <MemoryRouter>{node}</MemoryRouter>
      </AppThemeProvider>
    </AuthContext.Provider>,
  );
};

// Экраны/компоненты под проверку (имя → узел). Прогоняются в обеих темах.
const SUBJECTS: Record<string, React.ReactNode> = {
  'AuthForm (login)': <AuthForm mode="login" />,
  'AuthForm (register)': <AuthForm mode="register" />,
  'SolveCard (solving)': <SolveCard solve={solve()} canControl isCoach={false} onHint={vi.fn()} onRestart={vi.fn()} onExit={vi.fn()} />,
  'SolveCard (solved)': <SolveCard solve={solve({ status: 'solved', index: 6 })} canControl isCoach onHint={vi.fn()} onRestart={vi.fn()} onExit={vi.fn()} />,
  // Курсы (Фаза A/B): листовые компоненты плеера/редактора — проверяем aria в обеих темах.
  'Course MarkdownView': <MarkdownView body={'## Heading\n\nSome **bold** and *italic* text.\n\n- one\n- two'} />,
  'Course PuzzleSourceDialogs': <PuzzleSourceDialogs onAdd={() => {}} />,
};

describe('a11y (axe-core): ключевые экраны без нарушений доступности в обеих темах', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: {} } }, interpolation: { escapeValue: false } });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
    });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  for (const mode of ['light', 'dark'] as const) {
    for (const [name, node] of Object.entries(SUBJECTS)) {
      it(`${name} — ${mode}`, async () => {
        const { container } = renderInTheme(mode, node);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    }
  }
});
