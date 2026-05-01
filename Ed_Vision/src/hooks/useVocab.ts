import { useState, useEffect, useCallback } from 'react';
import { buildUrl } from '@/services/api/config';

// ── Auth helper ───────────────────────────────────────────────────────────────
function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = localStorage.getItem('token') ?? '';
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VocabDefinition {
  id: number;
  pos: string;
  meaning: string;
  exampleEn: string;
  exampleVi: string;
}

export interface VocabWordApi {
  id: number;
  word: string;
  level: string;
  freq: number;
  audioUrl: string | null;
  isKnown: boolean;
  correctStreak: number;
  definitions: VocabDefinition[];
}

export interface VocabTopicApi {
  id: number;
  slug: string;
  titleVI: string;
  titleEN: string;
  emoji: string;
  certType: string;
  wordCount: number;
  knownCount: number;
  progress: number;
}

export interface VocabTopicDetail {
  id: number;
  titleVI: string;
  titleEN: string;
  emoji: string;
}

export interface VocabWordPageResult {
  topic: VocabTopicDetail;
  data: VocabWordApi[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface VocabStats {
  totalWords: number;
  knownWords: number;
  topics: number;
  highFreqKnown: number;
}

const ENROLLMENT_CACHE_PREFIX = 'edvision.enrollment';

function resolveLocalAccountId(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { account_id?: number; accountId?: number; id?: number };
    const id = parsed.account_id ?? parsed.accountId ?? parsed.id;
    if (!id) return null;
    return String(id);
  } catch {
    return null;
  }
}

function getEnrollmentCacheKey(certType: string, accountId?: string | null) {
  if (accountId) return `${ENROLLMENT_CACHE_PREFIX}.${certType}.${accountId}`;
  return `${ENROLLMENT_CACHE_PREFIX}.${certType}`;
}

// ── Resolve enrollment_id (localStorage → API fallback) ──────────────────────
export async function resolveEnrollmentId(certType = 'toeic'): Promise<number | null> {
  const accountId = resolveLocalAccountId();
  const cacheKey = getEnrollmentCacheKey(certType, accountId);
  if (accountId && certType === 'toeic') localStorage.removeItem('toeic_enrollment_id');
  const cached = localStorage.getItem(cacheKey);
  if (cached) return Number(cached);
  try {
    const url = buildUrl('student/certificate/enrollment', { certType });
    const res = await authFetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: number; enrollment_id?: number };
    const id = data.id ?? data.enrollment_id ?? null;
    if (id) localStorage.setItem(cacheKey, String(id));
    return id;
  } catch {
    return null;
  }
}

// ── Hook: topics list ─────────────────────────────────────────────────────────
export function useVocabTopics(enrollmentId: number | null, certType = 'toeic') {
  const [topics, setTopics] = useState<VocabTopicApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedId, setResolvedId] = useState<number | null>(enrollmentId);

  useEffect(() => {
    if (enrollmentId) { setResolvedId(enrollmentId); return; }
    resolveEnrollmentId(certType).then(setResolvedId);
  }, [enrollmentId, certType]);

  const fetchTopics = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl('student/vocab/topics', { enrollment_id: resolvedId, cert_type: certType });
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTopics(await res.json() as VocabTopicApi[]);
    } catch (e) {
      setError('Không thể tải danh sách chủ đề.');
      console.error('[useVocabTopics]', e);
    } finally {
      setLoading(false);
    }
  }, [resolvedId, certType]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics, resolvedId };
}

// ── Hook: words in a topic (paginated) ───────────────────────────────────────
export function useVocabWords(
  enrollmentId: number | null,
  topicId: number | null,
  page = 1,
  limit = 10,
) {
  const [result, setResult] = useState<VocabWordPageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    if (!enrollmentId || !topicId) return;
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl(`student/vocab/topics/${topicId}/words`, {
        enrollment_id: enrollmentId, page, limit,
      });
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json() as VocabWordPageResult);
    } catch (e) {
      setError('Không thể tải từ vựng.');
      console.error('[useVocabWords]', e);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, topicId, page, limit]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  return { result, loading, error, refetch: fetchWords };
}

// ── Hook: vocab stats ─────────────────────────────────────────────────────────
export function useVocabStats(enrollmentId: number | null) {
  const [stats, setStats] = useState<VocabStats | null>(null);

  useEffect(() => {
    if (!enrollmentId) return;
    authFetch(buildUrl('student/vocab/stats', { enrollment_id: enrollmentId }))
      .then((r) => r.json())
      .then((d: VocabStats) => setStats(d))
      .catch(console.error);
  }, [enrollmentId]);

  return stats;
}

// ── API calls ─────────────────────────────────────────────────────────────────
export async function apiToggleKnown(
  enrollmentId: number,
  wordId: number,
  isKnown: boolean,
): Promise<void> {
  await authFetch(
    buildUrl(`student/vocab/words/${wordId}/toggle`, { enrollment_id: enrollmentId }),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_known: isKnown }) },
  );
}

export async function apiGetKnownWords(enrollmentId: number, topicId?: number): Promise<VocabWordApi[]> {
  const url = buildUrl('student/vocab/known-words', {
    enrollment_id: enrollmentId,
    ...(topicId ? { topic_id: topicId } : {}),
  });
  return authFetch(url).then((r) => r.json()) as Promise<VocabWordApi[]>;
}

export async function apiStartTestSession(
  enrollmentId: number,
  mode: 'flashcard' | 'write',
  limit = 20,
  topicId?: number,
) {
  const url = buildUrl('student/vocab/test-session/start', { enrollment_id: enrollmentId });
  return authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, limit, topic_id: topicId }),
  }).then((r) => r.json());
}

export async function apiSubmitAnswer(
  enrollmentId: number,
  sessionId: number,
  wordId: number,
  opts: { mode: 'flashcard'; isCorrect: boolean } | { mode: 'write'; userInput: string },
) {
  const url = buildUrl(`student/vocab/test-session/${sessionId}/submit`, { enrollment_id: enrollmentId });
  const body = opts.mode === 'flashcard'
    ? { word_id: wordId, is_correct: opts.isCorrect }
    : { word_id: wordId, user_input: opts.userInput };
  return authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

export async function apiFinishSession(enrollmentId: number, sessionId: number) {
  return authFetch(
    buildUrl(`student/vocab/test-session/${sessionId}/finish`, { enrollment_id: enrollmentId }),
    { method: 'POST' },
  ).then((r) => r.json());
}
