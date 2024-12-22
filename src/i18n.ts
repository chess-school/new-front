// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Конфигурация i18next
i18n
  .use(HttpBackend) // Используем http backend для загрузки переводов
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Путь к файлам переводов
    },
    lng: 'en', // Язык по умолчанию
    fallbackLng: 'en', // Язык для резервного случая
    interpolation: {
      escapeValue: false,
    },
    debug: true
  });

export default i18n;
