import type { ExerciseSetResponse, WordResponse, WordSummary } from './types';

const DEFAULT_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:5004').replace(/\/$/, '');
const STORAGE_KEY = 'learningSystem.apiBaseUrl';

let runtimeOverride: string | null = null;

const sanitizeBaseUrl = (value: string) => value.replace(/\/$/, '');

export const getDefaultApiBaseUrl = () => DEFAULT_BASE;

export const setApiBaseUrlOverride = (value: string | null) => {
  runtimeOverride = value ? sanitizeBaseUrl(value) : null;
  if (typeof window !== 'undefined') {
    if (runtimeOverride) {
      window.localStorage.setItem(STORAGE_KEY, runtimeOverride);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
};

const readStoredBaseUrl = () => {
  if (typeof window === 'undefined') {
    return runtimeOverride;
  }

  if (runtimeOverride) {
    return runtimeOverride;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    runtimeOverride = sanitizeBaseUrl(stored);
    return runtimeOverride;
  }

  return null;
};

export const getApiBaseUrl = () => readStoredBaseUrl() ?? DEFAULT_BASE;

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  if (!path) {
    return baseUrl;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
};

export const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const fetchWord = (wordId: number | string) => fetchJson<WordResponse>(`/word/${wordId}`);

export const fetchWords = () => fetchJson<WordSummary[]>('/words');

export const fetchWordExercises = (
  wordId: number | string,
  params?: { limit?: number; options?: number }
) => {
  const searchParams = new URLSearchParams();
  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }
  if (params?.options) {
    searchParams.set('options', String(params.options));
  }

  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';
  return fetchJson<ExerciseSetResponse>(`/api/learning/word/${wordId}/exercises${suffix}`);
};
