import { supabase } from './supabase';

const API_URL = 'http://localhost:5000/api';

let activeSessionPromise: Promise<any> | null = null;

async function getAccessToken() {
  if (!activeSessionPromise) {
    activeSessionPromise = supabase.auth.getSession().finally(() => {
      activeSessionPromise = null;
    });
  }
  const { data: { session } } = await activeSessionPromise;
  return session?.access_token;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();

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
    const token = await getAccessToken();
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
    const token = await getAccessToken();
    const fullUrl = `${API_URL}${url}`;
    console.log(`[API Post] ${fullUrl}`, data);
    const response = await fetch(fullUrl, {
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
    const token = await getAccessToken();
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
    const token = await getAccessToken();
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
