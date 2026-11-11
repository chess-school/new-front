import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Реальная проверка контраста (WCAG AA) в ОБЕИХ темах на живых страницах.
 * jsdom/jest-axe контраст НЕ считает — только настоящий браузер. Тема переключается через
 * localStorage['mob-theme'] до загрузки; authed-страницы получают токен (E2E_TOKEN) в
 * localStorage['token'] — иначе они редиректят на /login и реальный контент не отрисуется.
 *
 * Запуск:  E2E_TOKEN=$(cd ../backend && node scripts/e2e-token.js --role=ADMIN) npx playwright test
 */
const THEMES = ['light', 'dark'] as const;
const ORIGIN = new URL(process.env.E2E_BASE_URL || 'https://chess.motorcycles').origin;
const TOKEN = process.env.E2E_TOKEN || '';
const COURSE_ID = process.env.E2E_COURSE_ID || '';

// Публичные (без токена) — рендерятся всегда, включая страницу входа.
const PUBLIC_ROUTES = ['/login', '/analysis', '/blindfold', '/coaches', '/c/mind-over-board'];
// Требуют авторизации — проверяем только при наличии E2E_TOKEN.
const AUTH_ROUTES = ['/puzzles', '/books', ...(COURSE_ID ? [`/courses/${COURSE_ID}`, '/club/courses'] : ['/club/courses'])];

const storage = (theme: string, withToken: boolean) => ({
  cookies: [],
  origins: [{
    origin: ORIGIN,
    localStorage: [
      { name: 'mob-theme', value: theme },
      ...(withToken && TOKEN ? [{ name: 'token', value: TOKEN }] : []),
    ],
  }],
});

async function contrastViolations(page: Page, route: string, theme: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  // Дать async-контенту (задачи, курс, движок) прогрузиться — контраст на реальном тексте.
  await page.waitForTimeout(2500);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag2a']).analyze();
  const contrast = violations.filter((v) => v.id === 'color-contrast');
  if (contrast.length) {
    const detail = contrast.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n').slice(-1)[0] ?? ''}`));
    console.log(`\n[${theme}] ${route} — ${detail.length} контраст-нарушений:\n  ${detail.join('\n  ')}`);
  }
  return contrast;
}

for (const theme of THEMES) {
  test.describe(`контраст (публичные) — ${theme}`, () => {
    test.use({ storageState: storage(theme, false) });
    for (const route of PUBLIC_ROUTES) {
      test(`${route}`, async ({ page }) => {
        expect(await contrastViolations(page, route, theme), `${route} (${theme})`).toEqual([]);
      });
    }
  });

  test.describe(`контраст (авторизованные) — ${theme}`, () => {
    test.skip(!TOKEN, 'нет E2E_TOKEN — authed-маршруты пропущены');
    test.use({ storageState: storage(theme, true) });
    for (const route of AUTH_ROUTES) {
      test(`${route}`, async ({ page }) => {
        expect(await contrastViolations(page, route, theme), `${route} (${theme})`).toEqual([]);
      });
    }
  });
}
