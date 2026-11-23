import { test, expect } from '@playwright/test';

/**
 * Смоук публичных страниц: каждая отдаёт не-ошибочный ответ, монтирует SPA (#root непустой),
 * имеет осмысленный <title> бренда debiut и не ловит 5xx по сети. Креды НЕ требуются.
 *
 * По умолчанию — против прода (playwright.config.ts). Локально:
 *   E2E_BASE_URL=http://localhost:5173 npm run e2e -- smoke
 */
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/coaches',
  '/analysis',
  '/puzzles',
  '/login',
  '/register',
];

for (const route of PUBLIC_ROUTES) {
  test(`public smoke: ${route}`, async ({ page }) => {
    const server5xx: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500) server5xx.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    });

    const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(resp, `нет ответа на ${route}`).toBeTruthy();
    expect(resp!.status(), `HTTP на ${route}`).toBeLessThan(400);

    // SPA смонтировалась: #root получил содержимое
    await page.waitForFunction(() => {
      const el = document.getElementById('root');
      return !!el && el.childElementCount > 0;
    }, { timeout: 15_000 });

    // Заголовок бренда
    await expect(page).toHaveTitle(/debiut/i);

    // Никаких 5xx при загрузке публичной страницы
    expect(server5xx, `5xx на ${route}:\n${server5xx.join('\n')}`).toHaveLength(0);
  });
}
