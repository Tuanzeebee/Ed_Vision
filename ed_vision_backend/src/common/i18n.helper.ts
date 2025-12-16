/**
 * i18n Helper Service for Backend
 * 
 * Provides utility functions for translation in backend services
 */

import { I18nContext, I18nService } from 'nestjs-i18n';

/**
 * Get translated error message
 * For use in exception handlers
 */
export function getI18nErrorMessage(
  key: string,
  lang?: string,
  args?: Record<string, any>,
): string {
  const i18n = I18nContext.current();
  return i18n ? i18n.t(key, { lang, args }) : key;
}

/**
 * Translate message with context
 */
export function translate(
  key: string,
  options?: { lang?: string; args?: Record<string, any> },
): string {
  const i18n = I18nContext.current();
  return i18n ? i18n.t(key, options) : key;
}

/**
 * Create standard error response with translation key
 * Frontend will translate this key
 */
export function createErrorResponse(errorKey: string, statusCode: number = 400) {
  return {
    statusCode,
    errorKey, // Frontend will use this to translate
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create standard success response with data
 * Use keys for status messages that need translation
 */
export function createSuccessResponse<T>(data: T, messageKey?: string) {
  return {
    data,
    messageKey, // Optional translation key for success message
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrap status/enum values as keys
 * These should be translated on frontend
 */
export function createStatusKey(domain: string, status: string): string {
  return `${domain}.status.${status}`;
}

/**
 * Create translation key following convention: domain.feature.action
 */
export function createTranslationKey(
  domain: string,
  feature: string,
  action: string,
): string {
  return `${domain}.${feature}.${action}`;
}
