// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', 
    },
    lng: 'en',
    fallbackLng: 'en', 
    interpolation: {
      escapeValue: false,
    },
    debug: true
  });

export default i18n;
