import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  setApiBaseUrlOverride
} from '@/src/lib/apiClient';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
interface LearningContextValue {
  userId: string;
  setUserId(userId: string): void;
  availableUsers: string[];
  apiBaseUrl: string;
  setApiBaseUrl(baseUrl: string): void;
  resetApiBaseUrl(): void;
}
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */
/* eslint-enable @typescript-eslint/no-unused-vars */

const DEFAULT_USERS = ['test_user_001', 'test_user_002', 'test_user_003', 'user123'];
const USER_STORAGE_KEY = 'learningSystem.userId';
const USERS_STORAGE_KEY = 'learningSystem.availableUsers';

const LearningContext = createContext<LearningContextValue | undefined>(undefined);

const readInitialUserId = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_USERS[0];
  }
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  return stored || DEFAULT_USERS[0];
};

const readInitialUsers = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_USERS;
  }
  const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(stored) as string[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse stored users list', error);
  }
  return DEFAULT_USERS;
};

export const LearningProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [userId, setUserIdState] = useState<string>(() => readInitialUserId());
  const [availableUsers, setAvailableUsers] = useState<string[]>(() => readInitialUsers());
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(() => getApiBaseUrl());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setApiBaseUrlOverride(apiBaseUrl);
  }, [apiBaseUrl]);

  const persistUsers = useCallback((users: string[]) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, []);

  const updateAvailableUsers = useCallback((nextUserId: string) => {
    setAvailableUsers(prev => {
      if (prev.includes(nextUserId)) {
        return prev;
      }
      const updated = [...prev, nextUserId];
      persistUsers(updated);
      return updated;
    });
  }, [persistUsers]);

  const setUserId = useCallback((nextUserId: string) => {
    const trimmed = nextUserId.trim();
    if (!trimmed) {
      return;
    }
    setUserIdState(trimmed);
    updateAvailableUsers(trimmed);
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

  const value = useMemo<LearningContextValue>(() => ({
    userId,
    setUserId,
    availableUsers,
    apiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl
  }), [apiBaseUrl, availableUsers, resetApiBaseUrl, setApiBaseUrl, setUserId, userId]);

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
