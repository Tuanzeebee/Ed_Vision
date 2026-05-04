import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS?.trim();
  if (!rawOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const parsedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsedOrigins.length > 0 ? parsedOrigins : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function createOriginHandler() {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new Error(`Origin ${origin ?? 'unknown'} is not allowed by CORS policy`),
    );
  };
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin: createOriginHandler(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
  };
}

export function buildSocketCorsOptions() {
  return {
    origin: createOriginHandler(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  };
}

export function getTrustedProxySetting(): boolean | number | string {
  const rawValue = process.env.TRUST_PROXY?.trim();
  if (!rawValue) {
    return false;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  if (/^\d+$/.test(rawValue)) {
    return Number(rawValue);
  }

  return rawValue;
}
