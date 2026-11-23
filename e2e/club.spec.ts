import { test, expect } from '@playwright/test';

/**
 * Смоук публичного сайта клуба /c/:slug (брендированный каркас, PageRenderer по SitePage-блокам).
 * У клуб-сайта свой заголовок/бренд, поэтому проверяем только: не-ошибочный ответ, монтаж SPA,
 * наличие осмысленного контента и 0×5xx. Slug — seed-данные (переопределяется E2E_CLUB_SLUG).
 *
 *   E2E_BASE_URL=http://localhost:5173 npm run e2e -- club
 */
const SLUG = process.env.E2E_CLUB_SLUG || 'mind-over-board';

test(`club site renders: /c/${SLUG}`, async ({ page }) => {
  const server5xx: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 500) server5xx.push(`${r.status()} ${r.url()}`);
  });

  const resp = await page.goto(`/c/${SLUG}`, { waitUntil: 'networkidle' });
  expect(resp, `нет ответа на /c/${SLUG}`).toBeTruthy();
  expect(resp!.status(), `HTTP на /c/${SLUG}`).toBeLessThan(400);

  await page.waitForFunction(() => {
    const el = document.getElementById('root');
    return !!el && el.childElementCount > 0;
  }, { timeout: 15_000 });

  // Отрисовался реальный контент страницы (не пустой каркас)
  const textLen = await page.evaluate(() => (document.body.innerText || '').trim().length);
  expect(textLen, 'клуб-сайт отрисовал пустую страницу').toBeGreaterThan(40);

  expect(server5xx, `5xx на /c/${SLUG}:\n${server5xx.join('\n')}`).toHaveLength(0);
});
