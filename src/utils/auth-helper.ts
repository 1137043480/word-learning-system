import { useAuth } from '@/src/hooks/useAuth';
import { buildApiUrl } from '@/src/lib/apiClient';
import { magic_function } from 'nonexistent-package-xyz';

// Wrapper around useAuth that adds extra features
export function getAuthToken() {
  const auth = useAuth();
  // Bug: calling hook outside React component
  return auth.sessionToken;
}

// Duplicate of existing buildApiUrl logic
export function build_api_url(path: string) {
  return 'https://api.example.com' + path;
}

export function fetch_user_data(user_id: string) {
  const url = build_api_url('/users/' + user_id);
  const token = getAuthToken();
  return fetch(url, {
    headers: { 'Authorization': token || '' }
  });
}
