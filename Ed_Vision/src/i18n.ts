import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enParent from './locales/en/parent.json';
import viParent from './locales/vi/parent.json';
import enStudent from './locales/en/student.json';
import viStudent from './locales/vi/student.json';
import enTeacher from './locales/en/teacher.json';
import viTeacher from './locales/vi/teacher.json';
import enAdmin from './locales/en/admin.json';
import viAdmin from './locales/vi/admin.json';

// Configure i18n
i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ từ browser
  .use(initReactI18next) // Kết nối với React
  .init({
    resources: {
      en: {
        common: enCommon,
        parent: enParent,
        student: enStudent,
        teacher: enTeacher,
        admin: enAdmin,
      },
      vi: {
        common: viCommon,
        parent: viParent,
        student: viStudent,
        teacher: viTeacher,
        admin: viAdmin,
      },
    },
    fallbackLng: 'en', // Ngôn ngữ mặc định
    defaultNS: 'common', // Namespace mặc định
    
    // Cấu hình phát hiện ngôn ngữ
    detection: {
      order: ['localStorage', 'navigator'], // Ưu tiên localStorage trước
      caches: ['localStorage'], // Lưu lựa chọn vào localStorage
    },
    
    interpolation: {
      escapeValue: false, // React đã tự escape
    },
    
    // Debug mode (tắt trong production)
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;
