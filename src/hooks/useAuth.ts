import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '@/src/lib/apiClient';

interface AuthState {
  sessionToken: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    sessionToken: null,
    userId: null,
    username: null,
    isAuthenticated: false,
    loading: true,
  });

  // 从localStorage加载token
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');

    if (token) {
      setState(prev => ({
        ...prev,
        sessionToken: token,
        userId,
        username,
        loading: true,
      }));
      validateSession(token);
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // 验证session是否有效
  const validateSession = useCallback(async (token: string) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/validate'), {
        headers: { 'X-Session-Token': token },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.valid) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          userId: result.user_id,
          loading: false,
        }));
      } else {
        // Session无效，清除
        logout();
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        loading: false,
      }));
    }
  }, []);

  // 登录
  const login = useCallback((token: string, userId: string, username: string) => {
    localStorage.setItem('session_token', token);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('username', username);

    setState({
      sessionToken: token,
      userId,
      username,
      isAuthenticated: true,
      loading: false,
    });
  }, []);

  // 登出
  const logout = useCallback(async () => {
    const token = state.sessionToken;

    // 调用登出API
    if (token) {
      try {
        await fetch(buildApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'X-Session-Token': token },
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout API failed:', error);
      }
    }

    // 清除本地存储
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');

    setState({
      sessionToken: null,
      userId: null,
      username: null,
      isAuthenticated: false,
      loading: false,
    });
  }, [state.sessionToken]);

  // 刷新session（延长有效期）
  const refreshSession = useCallback(async () => {
    if (state.sessionToken) {
      await validateSession(state.sessionToken);
    }
  }, [state.sessionToken, validateSession]);

  return {
    ...state,
    login,
    logout,
    refreshSession,
    validateSession,
  };
}

