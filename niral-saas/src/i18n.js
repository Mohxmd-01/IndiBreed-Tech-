import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const saved = localStorage.getItem('niralFarm_lang') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, hi: { translation: hi }, mr: { translation: mr } },
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage','navigator'], lookupLocalStorage: 'niralFarm_lang' },
  });

export default i18n;
