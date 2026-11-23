import { test, expect } from '@playwright/test';
import { authStorageState, E2E_TOKEN, E2E_BASE_URL } from './helpers/auth';

/**
 * Регрессия A.2 (antd→MUI toast): при ошибке API axios-интерсептор показывает MUI-тост
 * (.MuiSnackbar-root), а не молчит и не падает. Форсируем 500 на non-silent authed-запросе.
 * Требует E2E_TOKEN (иначе describe пропускается).
 *
 *   export E2E_TOKEN=$(cd ../backend && node scripts/e2e-token.js --role=ADMIN)
 *   E2E_BASE_URL=http://localhost:5173 npm run e2e -- toast
 */
test.describe('A.2 toast', () => {
  test.skip(!E2E_TOKEN, 'нет E2E_TOKEN');
  test.use({ storageState: authStorageState(E2E_TOKEN, E2E_BASE_URL) });

  test('ошибка API показывает MUI-тост', async ({ page }) => {
    await page.route('**/api/v2/play/me**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"msg":"E2E forced error"}' }),
    );
    await page.goto('/play', { waitUntil: 'domcontentloaded' });

    const snackbar = page.locator('.MuiSnackbar-root');
    await expect(snackbar.first()).toBeVisible({ timeout: 10_000 });
    await expect(snackbar.first()).toContainText('E2E forced error');
  });
});
