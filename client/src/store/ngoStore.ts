import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

export interface NgoOrganization {
  id: string;
  user_id: string;
  org_name: string;
  org_type: string;
  registration_number: string;
  contact_person: string;
  designation?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  status: 'pending_verification' | 'verified' | 'suspended' | 'rejected';
  trust_score: number;
  primary_address: string;
  primary_lat: number;
  primary_lng: number;
  service_radius_km: number;
  dietary_restrictions: string[];
  food_type_preferences: string[];
  beneficiary_count: number;
  bio?: string;
  website?: string;
  logo_url?: string;
  cover_photo_url?: string;
  total_kg_received: number;
  total_tasks_completed: number;
  rating: number;
  ngo_locations?: NgoLocation[];
  created_at: string;
}

export interface NgoLocation {
  id: string;
  ngo_id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  is_primary: boolean;
  capacity_kg?: number;
  operating_hours: any;
}

export interface NgoVolunteer {
  id: string;
  ngo_id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  profile_photo_url?: string;
  role: 'volunteer' | 'employee' | 'team_lead' | 'driver';
  vehicle_type?: string;
  vehicle_number?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  availability_status: 'available' | 'on_task' | 'break' | 'offline';
  current_lat?: number;
  current_lng?: number;
  total_tasks_completed: number;
  total_kg_collected: number;
  rating: number;
  join_date: string;
}

export interface NgoFoodClaim {
  id: string;
  ngo_id: string;
  listing_id: string;
  quantity_claimed: number;
  quantity_unit: string;
  status: string;
  pickup_otp: string;
  pickup_otp_verified: boolean;
  actual_quantity_received?: number;
  created_at: string;
  updated_at: string;
  food_listings?: any;
  ngo_locations?: any;
  volunteer_tasks?: any[];
}

export interface VolunteerTask {
  id: string;
  claim_id: string;
  ngo_id: string;
  volunteer_id?: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  status: string;
  assigned_at: string;
  actual_kg_collected?: number;
  volunteer?: NgoVolunteer;
  ngo_food_claims?: NgoFoodClaim;
}

export interface Analytics {
  total_kg_received: number;
  total_meals_estimated: number;
  tasks_completed: number;
  tasks_in_progress: number;
  available_volunteers: number;
  total_volunteers: number;
  co2_saved_kg: number;
  food_value_saved_inr: number;
}

interface NgoState {
  ngo: NgoOrganization | null;
  loading: boolean;
  volunteers: NgoVolunteer[];
  claims: NgoFoodClaim[];
  tasks: VolunteerTask[];
  activeTasks: VolunteerTask[];
  analytics: Analytics | null;
  aiSuggestions: any[];
  aiBriefing: string | null;
  notifications: any[];

  fetchNgo: () => Promise<void>;
  fetchVolunteers: (filters?: any) => Promise<void>;
  fetchClaims: (status?: string) => Promise<void>;
  fetchTasks: (filters?: any) => Promise<void>;
  fetchActiveTasks: () => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  fetchAiBriefing: () => Promise<void>;
  fetchAiSuggestions: () => Promise<void>;
  createClaim: (data: any) => Promise<any>;
  cancelClaim: (id: string, reason: string) => Promise<void>;
  createTask: (data: any) => Promise<any>;
  cancelTask: (id: string) => Promise<void>;
  reassignTask: (id: string, volunteer_id: string) => Promise<void>;
  addVolunteer: (data: any) => Promise<any>;
  updateVolunteer: (id: string, data: any) => Promise<void>;
  deleteVolunteer: (id: string) => Promise<void>;
  rateVolunteer: (task_id: string, rating: number, feedback: string) => Promise<void>;
  setNgo: (ngo: NgoOrganization | null) => void;
}

export const useNgoStore = create<NgoState>((set, get) => ({
  ngo: null,
  loading: false,
  volunteers: [],
  claims: [],
  tasks: [],
  activeTasks: [],
  analytics: null,
  aiSuggestions: [],
  aiBriefing: null,
  notifications: [],

  setNgo: (ngo) => set({ ngo }),

  fetchNgo: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/ngo/me');
      set({ ngo: res.data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchVolunteers: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/ngo/volunteers?${params}`);
      set({ volunteers: res.data.data || [] });
    } catch {}
  },

  fetchClaims: async (status = 'all') => {
    try {
      const res = await api.get(`/ngo/claims?status=${status}`);
      set({ claims: res.data.data || [] });
    } catch {}
  },

  fetchTasks: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/ngo/tasks?${params}`);
      set({ tasks: res.data.data || [] });
    } catch {}
  },

  fetchActiveTasks: async () => {
    try {
      const res = await api.get('/ngo/tasks/active');
      set({ activeTasks: res.data.data || [] });
    } catch {}
  },

  fetchAnalytics: async (period = 'month') => {
    try {
      const res = await api.get(`/ngo/analytics/overview?period=${period}`);
      set({ analytics: res.data.data });
    } catch {}
  },

  fetchAiBriefing: async () => {
    try {
      const res = await api.get('/ngo/ai-daily-briefing');
      set({ aiBriefing: res.data.data?.briefing || null });
    } catch {}
  },

  fetchAiSuggestions: async () => {
    try {
      const res = await api.post('/ngo/ai-suggest-assignments', {});
      set({ aiSuggestions: res.data.data || [] });
    } catch {}
  },

  createClaim: async (data) => {
    const res = await api.post('/ngo/claims', data);
    if (res.data.success) {
      get().fetchClaims();
    }
    return res.data;
  },

  cancelClaim: async (id, reason) => {
    await api.put(`/ngo/claims/${id}/cancel`, { cancellation_reason: reason });
    get().fetchClaims();
  },

  createTask: async (data) => {
    const res = await api.post('/ngo/tasks', data);
    if (res.data.success) {
      get().fetchTasks();
      get().fetchClaims();
      get().fetchVolunteers();
    }
    return res.data;
  },

  cancelTask: async (id) => {
    await api.put(`/ngo/tasks/${id}/cancel`, {});
    get().fetchTasks();
    get().fetchClaims();
  },

  reassignTask: async (id, volunteer_id) => {
    await api.put(`/ngo/tasks/${id}/reassign`, { volunteer_id });
    get().fetchTasks();
    get().fetchVolunteers();
  },

  addVolunteer: async (data) => {
    const res = await api.post('/ngo/volunteers', data);
    if (res.data.success) get().fetchVolunteers();
    return res.data;
  },

  updateVolunteer: async (id, data) => {
    await api.put(`/ngo/volunteers/${id}`, data);
    get().fetchVolunteers();
  },

  deleteVolunteer: async (id) => {
    await api.delete(`/ngo/volunteers/${id}`);
    get().fetchVolunteers();
  },

  rateVolunteer: async (task_id, rating, feedback) => {
    await api.post(`/ngo/tasks/${task_id}/rate-volunteer`, { rating, feedback });
    get().fetchTasks();
  },
}));
