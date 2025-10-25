/**
 * Translation Helper Utilities
 * 
 * Các hàm tiện ích để làm việc với i18n
 */

import type { TFunction } from 'i18next';

/**
 * Format số với ngôn ngữ hiện tại
 */
export const formatNumber = (num: number, language: string): string => {
  return new Intl.NumberFormat(language).format(num);
};

/**
 * Format ngày tháng với ngôn ngữ hiện tại
 */
export const formatDate = (
  date: Date | string,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(language, defaultOptions).format(dateObj);
};

/**
 * Format thời gian với ngôn ngữ hiện tại
 */
export const formatTime = (
  date: Date | string,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(language, defaultOptions).format(dateObj);
};

/**
 * Format currency với ngôn ngữ hiện tại
 */
export const formatCurrency = (
  amount: number,
  language: string,
  currency = 'VND'
): string => {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Lấy tên ngôn ngữ hiển thị
 */
export const getLanguageName = (langCode: string): string => {
  const languageNames: Record<string, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
  };
  return languageNames[langCode] || langCode;
};

/**
 * Lấy flag emoji cho ngôn ngữ
 */
export const getLanguageFlag = (langCode: string): string => {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
  };
  return flags[langCode] || '🌐';
};

/**
 * Helper để tạo translation key có type-safety
 */
export const createTranslationKeys = <T extends Record<string, any>>(
  _namespace: string,
  keys: T
): T => {
  return keys;
};

/**
 * Kiểm tra xem có translation key tồn tại không
 */
export const hasTranslation = (t: TFunction, key: string): boolean => {
  const translation = t(key);
  return translation !== key;
};

/**
 * Get translated array (ví dụ: danh sách options)
 */
export const getTranslatedArray = (
  t: TFunction,
  baseKey: string,
  length: number
): string[] => {
  return Array.from({ length }, (_, i) => t(`${baseKey}.${i}`));
};

/**
 * Safe translation - fallback nếu key không tồn tại
 */
export const safeTranslate = (
  t: TFunction,
  key: string,
  fallback: string
): string => {
  const translation = t(key);
  return translation !== key ? translation : fallback;
};

/**
 * Pluralize helper - xử lý số nhiều/ít
 */
export const pluralize = (
  count: number,
  t: TFunction,
  key: string
): string => {
  return t(key, { count });
};

/**
 * Translate với default namespace
 */
export const td = (t: TFunction, key: string, namespace = 'common'): string => {
  return t(`${namespace}:${key}`);
};

/**
 * Type definitions cho translation namespaces
 */
export type TranslationNamespace =
  | 'common'
  | 'parent'
  | 'student'
  | 'teacher'
  | 'admin';

/**
 * Hook wrapper với namespace mặc định
 */
export const useTypedTranslation = () => {
  // This is just a type helper, actual implementation uses useTranslation from react-i18next
  return {
    t: (key: string) => key,
    i18n: {} as any,
  };
};
