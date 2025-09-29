import type { WordResponse, WordSummary } from './types';

export const DEFAULT_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:5004').replace(/\/$/, '');

export const getApiBaseUrl = () => DEFAULT_API_BASE_URL;

export const buildApiUrl = (path: string) => {
  if (!path) {
    return DEFAULT_API_BASE_URL;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${DEFAULT_API_BASE_URL}${normalized}`;
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
