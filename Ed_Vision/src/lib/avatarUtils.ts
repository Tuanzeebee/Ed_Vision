/**
 * Utility functions for handling user avatars with gender-based defaults
 */
import { buildAssetUrl } from '@/services/api/config';

// Default avatar URLs from public folder
const DEFAULT_MALE_AVATAR = '/avtnam.png';
const DEFAULT_FEMALE_AVATAR = '/avtnu.png';

// Host nội bộ của backend đã từng bị hard-code trong các bản dữ liệu cũ.
// Khi gặp các URL này ta strip phần origin để resolve lại theo origin hiện tại
// (tunnel www.teamnghiencuu.id.vn hoặc localhost dev).
const LEGACY_BACKEND_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?/i,
  /^https?:\/\/0\.0\.0\.0(:\d+)?/i,
];

function normalizeBackendPath(value: string): string {
  for (const re of LEGACY_BACKEND_ORIGINS) {
    if (re.test(value)) {
      return value.replace(re, '');
    }
  }
  return value;
}

// Simple SVG fallback avatars as data URIs (used if PNG files don't exist)
const FALLBACK_MALE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="100" fill="%234A90E2"/%3E%3Ccircle cx="100" cy="80" r="35" fill="white"/%3E%3Cpath d="M 50 150 Q 50 120 100 120 Q 150 120 150 150 L 150 200 L 50 200 Z" fill="white"/%3E%3C/svg%3E';
const FALLBACK_FEMALE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="100" fill="%23E91E63"/%3E%3Ccircle cx="100" cy="80" r="35" fill="white"/%3E%3Cpath d="M 50 150 Q 50 120 100 120 Q 150 120 150 150 L 150 200 L 50 200 Z" fill="white"/%3E%3Cellipse cx="70" cy="95" rx="15" ry="25" fill="white"/%3E%3Cellipse cx="130" cy="95" rx="15" ry="25" fill="white"/%3E%3C/svg%3E';

/**
 * Get avatar URL with gender-based fallback
 * @param avatarUrl - User's uploaded avatar URL (can be null/undefined)
 * @param gender - User's gender ('male', 'female', 'nam', 'nữ', etc.)
 * @returns Full avatar URL with appropriate default based on gender
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  gender: string | null | undefined
): string {
  // If user has uploaded avatar, use it
  if (avatarUrl) {
    // Strip các origin nội bộ cũ (localhost / 127.0.0.1 / 0.0.0.0) đã lưu
    // trong DB, rồi resolve lại theo origin hiện tại (tunnel hoặc localhost).
    const normalized = normalizeBackendPath(avatarUrl);
    // Nếu sau khi strip vẫn là URL tuyệt đối khác (CDN, S3, …) thì giữ nguyên.
    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }
    return buildAssetUrl(normalized);
  }

  // No uploaded avatar - use gender-based default
  const normalizedGender = (gender || '').toLowerCase().trim();
  
  // Check for female indicators
  const isFemale = 
    normalizedGender === 'female' ||
    normalizedGender === 'nữ' ||
    normalizedGender === 'nu' ||
    normalizedGender === 'f';

  // Return appropriate default avatar
  // PNG files should be placed in public folder by user
  // If PNG files don't exist, browser will show broken image, then fallback to SVG can be added via onError handler
  return isFemale ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR;
}

/**
 * Get fallback SVG avatar (used in onError handlers)
 * @param gender - User's gender
 * @returns SVG data URI
 */
export function getFallbackAvatarSvg(gender: string | null | undefined): string {
  const normalizedGender = (gender || '').toLowerCase().trim();
  const isFemale = 
    normalizedGender === 'female' ||
    normalizedGender === 'nữ' ||
    normalizedGender === 'nu' ||
    normalizedGender === 'f';
  
  return isFemale ? FALLBACK_FEMALE_SVG : FALLBACK_MALE_SVG;
}

/**
 * Get full avatar URL (legacy function for backward compatibility)
 * @deprecated Use getAvatarUrl instead
 */
export function getFullAvatarUrl(
  url: string | null | undefined,
  gender?: string | null
): string {
  return getAvatarUrl(url, gender);
}
