import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLearningContext } from '@/src/context/LearningContext';
import { fetchLearningState, saveLearningState } from '@/src/lib/apiClient';

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

/** Debounce timer ref type */
type TimerRef = ReturnType<typeof setTimeout> | null;

export const LearningSessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { userId } = useLearningContext();
  const [session, setSession] = useState<LearningSessionState>(() => loadSessionFromStorage(userId));
  const saveTimerRef = useRef<TimerRef>(null);
  const userIdRef = useRef(userId);

  // Keep userIdRef in sync
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Load from localStorage on user switch, then async-fetch from backend
  useEffect(() => {
    const localSession = loadSessionFromStorage(userId);
    setSession(localSession);

    // Async: fetch from backend and use if newer
    fetchLearningState(userId)
      .then(serverState => {
        if (!serverState || (!serverState.wordId && !serverState.module)) {
          return; // Server has no data, keep local
        }

        const serverTime = serverState.lastUpdated ? new Date(serverState.lastUpdated).getTime() : 0;
        const localTime = localSession.lastUpdated ? new Date(localSession.lastUpdated).getTime() : 0;

        if (serverTime > localTime) {
          // Server data is newer, use it
          const merged: LearningSessionState = {
            wordId: serverState.wordId ?? localSession.wordId,
            word: serverState.word ?? localSession.word,
            module: serverState.module ?? localSession.module,
            vksLevel: serverState.vksLevel ?? localSession.vksLevel,
            lastUpdated: serverState.lastUpdated ?? localSession.lastUpdated
          };
          setSession(merged);
          persistSessionToStorage(userId, merged);
          console.log('📥 学习进度已从服务器恢复');
        }
      })
      .catch(err => {
        console.warn('Failed to fetch learning state from server:', err);
      });
  }, [userId]);

  // Debounced save to backend
  const syncToBackend = useCallback((state: LearningSessionState) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const uid = userIdRef.current;
      saveLearningState(uid, {
        wordId: state.wordId,
        word: state.word,
        module: state.module,
        vksLevel: state.vksLevel
      }).then(() => {
        console.log('📤 学习进度已同步到服务器');
      }).catch(err => {
        console.warn('Failed to save learning state to server:', err);
      });
    }, 1000); // Debounce 1 second
  }, []);

  const updateSession = useCallback((partial: Partial<LearningSessionState>) => {
    setSession(prev => {
      const timestamp = partial.lastUpdated ?? new Date().toISOString();
      const next: LearningSessionState = {
        ...prev,
        ...partial,
        lastUpdated: timestamp
      };
      persistSessionToStorage(userIdRef.current, next);
      syncToBackend(next);
      return next;
    });
  }, [syncToBackend]);

  const clearSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
    persistSessionToStorage(userId, DEFAULT_SESSION);
    // Also clear on server
    saveLearningState(userId, {
      wordId: null,
      word: null,
      module: null,
      vksLevel: null
    }).catch(err => {
      console.warn('Failed to clear learning state on server:', err);
    });
  }, [userId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

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
