import type { BrowserContextOptions } from '@playwright/test';

/**
 * storageState для авторизованных e2e. Приложение перешло на HttpOnly-cookie `accessToken`
 * (пентест 13.11) и БОЛЬШЕ НЕ читает localStorage['token'] — поэтому старый способ инъекции
 * токена в localStorage молча редиректит на /login. Здесь ставим именно cookie.
 *
 * Токен минтится бэкенд-скриптом (реальный JWT_SECRET):
 *   export E2E_TOKEN=$(cd ../backend && node scripts/e2e-token.js --role=ADMIN)
 *
 * secure выводим из схемы baseURL: https (прод) → secure cookie; http (localhost) → несекьюрная.
 */
export function authStorageState(token: string, baseURL: string): BrowserContextOptions['storageState'] {
  const url = new URL(baseURL);
  const isHttps = url.protocol === 'https:';
  return {
    cookies: [
      {
        name: 'accessToken',
        value: token,
        domain: url.hostname,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
        httpOnly: true,
        secure: isHttps,
        sameSite: 'Strict' as const,
      },
    ],
    origins: [],
  };
}

export const E2E_TOKEN = process.env.E2E_TOKEN || '';
export const E2E_BASE_URL = process.env.E2E_BASE_URL || 'https://chess.motorcycles';
