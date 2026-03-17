import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLearningContext } from '@/src/context/LearningContext';

export interface LearningSessionState {
  wordId?: number | null;
  word?: string | null;
  module?: string | null;
  vksLevel?: string | null;
  lastUpdated?: string | null;
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
interface LearningSessionContextValue {
  session: LearningSessionState;
  updateSession(session: Partial<LearningSessionState>): void;
  clearSession(): void;
}
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

const DEFAULT_SESSION: LearningSessionState = {
  wordId: null,
  word: null,
  module: null,
  vksLevel: null,
  lastUpdated: null
};

const LearningSessionContext = createContext<LearningSessionContextValue | undefined>(undefined);

const storageKeyForUser = (userId: string) => `learningSession:${userId}`;

const loadSessionFromStorage = (userId: string): LearningSessionState => {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION;
  }
  try {
    const raw = window.localStorage.getItem(storageKeyForUser(userId));
    if (!raw) {
      return DEFAULT_SESSION;
    }
    const parsed = JSON.parse(raw) as LearningSessionState;
    if (parsed && typeof parsed === 'object') {
      return {
        wordId: parsed.wordId ?? null,
        word: parsed.word ?? null,
        module: parsed.module ?? null,
        vksLevel: parsed.vksLevel ?? null,
        lastUpdated: parsed.lastUpdated ?? null
      };
    }
  } catch (error) {
    console.warn('Failed to parse learning session from storage', error);
  }
  return DEFAULT_SESSION;
};

const persistSessionToStorage = (userId: string, session: LearningSessionState) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKeyForUser(userId), JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to persist learning session', error);
  }
};

export const LearningSessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { userId } = useLearningContext();
  const [session, setSession] = useState<LearningSessionState>(() => loadSessionFromStorage(userId));

  useEffect(() => {
    setSession(loadSessionFromStorage(userId));
  }, [userId]);

  const updateSession = useCallback((partial: Partial<LearningSessionState>) => {
    setSession(prev => {
      const timestamp = partial.lastUpdated ?? new Date().toISOString();
      const next: LearningSessionState = {
        ...prev,
        ...partial,
        lastUpdated: timestamp
      };
      persistSessionToStorage(userId, next);
      return next;
    });
  }, [userId]);

  const clearSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
    persistSessionToStorage(userId, DEFAULT_SESSION);
  }, [userId]);

  const value = useMemo<LearningSessionContextValue>(() => ({
    session,
    updateSession,
    clearSession
  }), [session, updateSession, clearSession]);

  return (
    <LearningSessionContext.Provider value={value}>
      {children}
    </LearningSessionContext.Provider>
  );
};

export const useLearningSession = () => {
  const context = useContext(LearningSessionContext);
  if (!context) {
    throw new Error('useLearningSession must be used within LearningSessionProvider');
  }
  return context;
};
