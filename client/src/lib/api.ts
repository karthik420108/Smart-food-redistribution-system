import { supabase } from './supabase';

const API_URL = 'http://127.0.0.1:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'API Request Failed');
  return json.data;
}
