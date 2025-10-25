// Type definitions for i18next
import 'react-i18next';

// Import all translation files
import common from './locales/en/common.json';
import parent from './locales/en/parent.json';
import student from './locales/en/student.json';
import teacher from './locales/en/teacher.json';
import admin from './locales/en/admin.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      parent: typeof parent;
      student: typeof student;
      teacher: typeof teacher;
      admin: typeof admin;
    };
  }
}
