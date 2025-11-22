import { buildApiUrl } from './apiClient';

/**
 * 带认证的fetch函数
 * 自动添加Session Token到请求头
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('session_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['X-Session-Token'] = token;
  }

  return fetch(buildApiUrl(url), {
    ...options,
    headers,
    credentials: 'include', // 支持cookie
  });
}

/**
 * 带认证的GET请求
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * 带认证的POST请求
 */
export async function authenticatedPost(
  url: string,
  data: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 带认证的PUT请求
 */
export async function authenticatedPut(
  url: string,
  data: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 带认证的DELETE请求
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'DELETE' });
}

