import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchUsers,
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  setApiBaseUrlOverride
} from '@/src/lib/apiClient';
import type { UserProfileSummary } from '@/src/lib/types';

export interface LearningUser {
  userId: string;
  username?: string | null;
  languageLevel?: string | null;
  nativeLanguage?: string | null;
  lastStudied?: string | null;
  wordsStudied?: number;
  lastSession?: {
    wordId?: number | null;
    word?: string | null;
    moduleType?: string | null;
    sessionType?: string | null;
    startedAt?: string | null;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
interface LearningContextValue {
  userId: string;
  setUserId: (_value: string) => void;
  availableUsers: LearningUser[];
  apiBaseUrl: string;
  setApiBaseUrl: (_value: string) => void;
  resetApiBaseUrl(): void;
  usersLoading: boolean;
  refreshUsers(): Promise<void>;
}
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

const DEFAULT_USERS: LearningUser[] = [
  { userId: 'test_user_001' },
  { userId: 'test_user_002' },
  { userId: 'test_user_003' },
  { userId: 'user123' }
];

const USER_STORAGE_KEY = 'learningSystem.userId';
const USERS_STORAGE_KEY = 'learningSystem.availableUsers';

const LearningContext = createContext<LearningContextValue | undefined>(undefined);

const readInitialUserId = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_USERS[0].userId;
  }
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  return stored || DEFAULT_USERS[0].userId;
};

const readInitialUsers = (): LearningUser[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_USERS;
  }
  const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(stored) as LearningUser[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(user => typeof user === 'object' && user !== null && 'userId' in user);
    }
  } catch (error) {
    console.warn('Failed to parse stored users list', error);
  }
  return DEFAULT_USERS;
};

const normalizeProfile = (profile: UserProfileSummary): LearningUser => ({
  userId: profile.userId,
  username: profile.username ?? null,
  languageLevel: profile.languageLevel ?? null,
  nativeLanguage: profile.nativeLanguage ?? null,
  lastStudied: profile.lastStudied ?? null,
  wordsStudied: typeof profile.wordsStudied === 'number' ? profile.wordsStudied : 0,
  lastSession: profile.lastSession
});

const mergeUser = (base: LearningUser | undefined, incoming: LearningUser): LearningUser => ({
  userId: incoming.userId,
  username: incoming.username ?? base?.username ?? null,
  languageLevel: incoming.languageLevel ?? base?.languageLevel ?? null,
  nativeLanguage: incoming.nativeLanguage ?? base?.nativeLanguage ?? null,
  lastStudied: incoming.lastStudied ?? base?.lastStudied ?? null,
  wordsStudied:
    typeof incoming.wordsStudied === 'number'
      ? incoming.wordsStudied
      : base?.wordsStudied ?? 0,
  lastSession: incoming.lastSession ?? base?.lastSession
});

const sortUsers = (users: LearningUser[]) =>
  users.slice().sort((a, b) => a.userId.localeCompare(b.userId));

export const LearningProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [userId, setUserIdState] = useState<string>(() => readInitialUserId());
  const [availableUsers, setAvailableUsers] = useState<LearningUser[]>(() => readInitialUsers());
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(() => getApiBaseUrl());
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setApiBaseUrlOverride(apiBaseUrl);
  }, [apiBaseUrl]);

  const persistUsers = useCallback((users: LearningUser[]) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, []);

  const updateAvailableUsers = useCallback((nextUser: LearningUser) => {
    if (!nextUser.userId) {
      return;
    }
    setAvailableUsers(prev => {
      const map = new Map<string, LearningUser>();
      prev.forEach(user => {
        map.set(user.userId, user);
      });
      const existing = map.get(nextUser.userId);
      map.set(nextUser.userId, mergeUser(existing, nextUser));
      const next = sortUsers(Array.from(map.values()));
      persistUsers(next);
      return next;
    });
  }, [persistUsers]);

  const setUserId = useCallback((nextUserId: string) => {
    const trimmed = nextUserId.trim();
    if (!trimmed) {
      return;
    }
    setUserIdState(trimmed);
    updateAvailableUsers({ userId: trimmed });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, trimmed);
    }
  }, [updateAvailableUsers]);

  const setApiBaseUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setApiBaseUrlState(getDefaultApiBaseUrl());
      setApiBaseUrlOverride(null);
      return;
    }
    setApiBaseUrlState(trimmed.replace(/\/$/, ''));
  }, []);

  const resetApiBaseUrl = useCallback(() => {
    setApiBaseUrlState(getDefaultApiBaseUrl());
    setApiBaseUrlOverride(null);
  }, []);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const remote = await fetchUsers({ limit: 200 }).catch(() => [] as UserProfileSummary[]);
      if (Array.isArray(remote) && remote.length > 0) {
        const normalized = remote.map(normalizeProfile);
        setAvailableUsers(prev => {
          const map = new Map<string, LearningUser>();
          prev.forEach(user => {
            map.set(user.userId, user);
          });
          normalized.forEach(user => {
            const existing = map.get(user.userId);
            map.set(user.userId, mergeUser(existing, user));
          });
          const next = sortUsers(Array.from(map.values()));
          persistUsers(next);
          return next;
        });
      } else {
        // 确保默认用户依然可用
        setAvailableUsers(prev => {
          if (prev.length === 0) {
            persistUsers(DEFAULT_USERS);
            return DEFAULT_USERS;
          }
          return prev;
        });
      }
    } catch (error) {
      console.warn('Failed to fetch users', error);
    } finally {
      setUsersLoading(false);
    }
  }, [persistUsers]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers, apiBaseUrl]);

  const value = useMemo<LearningContextValue>(() => ({
    userId,
    setUserId,
    availableUsers,
    apiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl,
    usersLoading,
    refreshUsers
  }), [apiBaseUrl, availableUsers, resetApiBaseUrl, setApiBaseUrl, setUserId, userId, usersLoading, refreshUsers]);

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearningContext = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearningContext must be used within LearningProvider');
  }
  return context;
};
