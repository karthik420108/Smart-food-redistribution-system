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

// Axios-compatible interface for store usage
const api = {
  get: async (url: string, config?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return { data: json };
  },
  post: async (url: string, data: any, config?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return { data: json };
  },
  put: async (url: string, data: any, config?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return { data: json };
  },
  delete: async (url: string, config?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return { data: json };
  },
};

export default api;
