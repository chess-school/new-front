# e2e — реальная проверка контраста (Playwright + axe-core)

jsdom/jest-axe **не считают контраст** — нужен настоящий браузер. Эти тесты открывают живые
страницы в обеих темах (`localStorage['mob-theme']`) и прогоняют axe-core (WCAG A/AA), падая
на `color-contrast`-нарушениях. Это ловит класс багов из статичных токенов (White to move,
оценка Stockfish, карточка solve, заголовок входа), который линтер-правило `no-restricted-syntax`
предотвращает на входе, а тут проверяется на отрендеренной странице.

## Требования (один раз, нужен sudo)

Браузеру нужны системные библиотеки:

```bash
sudo npx playwright install-deps chromium
```

(Chromium-бинарь уже скачан через `npx playwright install chromium`.)

## Запуск

По умолчанию — против прода. Authed-маршруты (/puzzles, /books, /courses, /club/courses)
требуют токен; минтим его бэкенд-скриптом (использует JWT_SECRET и реального юзера):

```bash
export E2E_TOKEN=$(cd ../backend && node scripts/e2e-token.js --role=ADMIN)
export E2E_COURSE_ID=<id опубликованного/доступного курса>   # для маршрута /courses/:id
npm run e2e
```

- Без `E2E_TOKEN` authed-маршруты пропускаются, публичные (/login, /analysis, /blindfold,
  /coaches, /c/:slug) всё равно проверяются.
- Другая цель: `E2E_BASE_URL=http://localhost:4173 npm run e2e` (напр. против `vite preview`).

## Что проверяется

8 маршрутов × 2 темы (+/courses/:id при E2E_COURSE_ID). Падение печатает конкретные узлы и
нехватку контраста — чинить заменой статичного `tokens.*` на MUI-токен темы
('text.primary'/'primary.main'/…), см. правило в `eslint.config.js`.
