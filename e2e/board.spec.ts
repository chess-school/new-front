import { test, expect } from '@playwright/test';

/**
 * Рендер шахматной доски на /analysis (публичный экран анализа с движком). react-chessboard (v4)
 * рисует 64 клетки с атрибутом [data-square]; наличие ≥64 клеток = доска+панели (Engine/Analysis)
 * смонтировались (ловит падения chess.js / Stockfish-воркера / самой доски, невидимые для smoke по #root).
 * /puzzles сюда НЕ входит: /puzzles/random требует авторизации + выбор источника — доски у гостя нет.
 *
 *   E2E_BASE_URL=http://localhost:5173 npm run e2e -- board
 */
const BOARD_ROUTES = ['/analysis'];

for (const route of BOARD_ROUTES) {
  test(`board renders: ${route}`, async ({ page }) => {
    const server5xx: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500) server5xx.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(route, { waitUntil: 'domcontentloaded' });

    // Доска грузится лениво (lazy chunk + chess.js) — ждём появления клеток
    await page.waitForSelector('[data-square]', { timeout: 20_000 });
    const squares = await page.locator('[data-square]').count();
    expect(squares, `на ${route} должно быть ≥64 клетки доски`).toBeGreaterThanOrEqual(64);

    expect(server5xx, `5xx на ${route}:\n${server5xx.join('\n')}`).toHaveLength(0);
  });
}
