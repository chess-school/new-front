import { test, expect } from '@playwright/test';
import { authStorageState, E2E_TOKEN, E2E_BASE_URL } from './helpers/auth';

/**
 * Смоук авторизованных маршрутов: с валидной cookie `accessToken` страница НЕ редиректит
 * на /login, монтирует SPA и не ловит 5xx. Требует E2E_TOKEN (иначе весь describe пропускается).
 *
 *   export E2E_TOKEN=$(cd ../backend && node scripts/e2e-token.js --role=ADMIN)
 *   E2E_BASE_URL=http://localhost:5173 npm run e2e -- authed
 */
const AUTH_ROUTES = ['/books', '/my-courses', '/play', '/schedule', '/my-games', '/inbox'];

test.describe('authed smoke', () => {
  test.skip(!E2E_TOKEN, 'нет E2E_TOKEN — пропускаем authed-смоук (см. e2e/helpers/auth.ts)');
  test.use({ storageState: authStorageState(E2E_TOKEN, E2E_BASE_URL) });

  for (const route of AUTH_ROUTES) {
    test(`authed smoke: ${route}`, async ({ page }) => {
      const server5xx: string[] = [];
      page.on('response', (r) => {
        if (r.status() >= 500) server5xx.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Не выкинуло на логин → cookie-авторизация сработала
      expect(page.url(), `${route} редиректнул на /login — авторизация не сработала`).not.toContain('/login');

      // SPA смонтирована
      await page.waitForFunction(() => {
        const el = document.getElementById('root');
        return !!el && el.childElementCount > 0;
      }, { timeout: 15_000 });

      expect(server5xx, `5xx на ${route}:\n${server5xx.join('\n')}`).toHaveLength(0);
    });
  }
});
