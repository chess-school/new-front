// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Поддерживаемые языки интерфейса (без русского — осознанно). См. feedback-no-ru-localization.
export const SUPPORTED_LANGS = ['en', 'pl', 'uk'] as const;
const STORAGE_KEY = 'debiut.lang';

// Нормализуем 'uk-UA' → 'uk' и отсеиваем неподдерживаемое.
const pick = (v?: string | null): string | null => {
  const base = (v || '').toLowerCase().split('-')[0];
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? base : null;
};

// Приоритет: ?lng= в URL → сохранённый выбор → язык браузера → en.
const fromQuery = pick(new URLSearchParams(window.location.search).get('lng'));
const fromStore = pick(localStorage.getItem(STORAGE_KEY));
const initialLang = fromQuery || fromStore || pick(navigator.language) || 'en';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

// Сохраняем выбор и держим <html lang> в актуальном состоянии (SEO + a11y).
const applyLang = (lng: string) => {
  try { localStorage.setItem(STORAGE_KEY, lng); } catch { /* приватный режим */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
i18n.on('languageChanged', applyLang);
applyLang(initialLang);

export default i18n;
