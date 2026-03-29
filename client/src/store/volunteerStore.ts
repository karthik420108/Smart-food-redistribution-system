import { create } from 'zustand';
import api from '../lib/api';

export interface VolunteerProfile {
  id: string;
  ngo_id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  profile_photo_url?: string;
  role: string;
  vehicle_type?: string;
  availability_status: 'available' | 'on_task' | 'break' | 'offline';
  total_tasks_completed: number;
  total_kg_collected: number;
  rating: number;
  ngo_organizations?: {
    org_name: string;
    logo_url?: string;
    primary_address: string;
  };
}

export interface ActiveTask {
  id: string;
  claim_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  pickup_window_start: string;
  pickup_window_end: string;
  special_instructions?: string;
  status: string;
  assigned_at: string;
  accepted_at?: string;
  arrived_pickup_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  ngo_food_claims?: {
    id: string;
    pickup_otp: string;
    quantity_claimed: number;
    quantity_unit: string;
    notes?: string;
    food_listings?: {
      title: string;
      images?: string[];
      food_type?: string;
      expiry_time?: string;
      pickup_address?: string;
      pickup_lat?: number;
      pickup_lng?: number;
      dietary_tags?: string[];
      donors?: {
        full_name: string;
        phone: string;
        whatsapp?: string;
        address?: string;
      };
    };
  };
  ngo_organizations?: {
    org_name: string;
    primary_address: string;
    primary_lat?: number;
    primary_lng?: number;
    phone?: string;
  };
}

interface VolunteerState {
  volunteer: VolunteerProfile | null;
  activeTask: ActiveTask | null;
  taskHistory: any[];
  chatMessages: any[];
  loading: boolean;

  fetchProfile: () => Promise<void>;
  fetchActiveTask: () => Promise<void>;
  fetchTaskHistory: () => Promise<void>;
  fetchChat: (task_id: string) => Promise<void>;
  updateAvailability: (status: 'available' | 'on_task' | 'break' | 'offline') => Promise<void>;
  updateTaskStatus: (task_id: string, status: string) => Promise<void>;
  verifyOtp: (task_id: string, otp: string) => Promise<any>;
  completeTask: (task_id: string, data: { actual_kg_collected: number; food_condition: string; volunteer_note?: string }) => Promise<any>;
  pingLocation: (data: { task_id?: string; lat: number; lng: number; speed_kmph?: number; heading?: number }) => Promise<void>;
  sendMessage: (task_id: string, message: string, type?: string) => Promise<void>;
  setVolunteer: (v: VolunteerProfile | null) => void;
}

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  volunteer: null,
  activeTask: null,
  taskHistory: [],
  chatMessages: [],
  loading: false,

  setVolunteer: (volunteer) => set({ volunteer }),

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/volunteer/me');
      set({ volunteer: res.data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchActiveTask: async () => {
    try {
      const res = await api.get('/volunteer/tasks/active');
      set({ activeTask: res.data.data || null });
    } catch {}
  },

  fetchTaskHistory: async () => {
    try {
      const res = await api.get('/volunteer/tasks');
      set({ taskHistory: res.data.data || [] });
    } catch {}
  },

  fetchChat: async (task_id) => {
    try {
      const res = await api.get(`/volunteer/chat/${task_id}`);
      set({ chatMessages: res.data.data || [] });
    } catch {}
  },

  updateAvailability: async (status) => {
    try {
      await api.put('/volunteer/availability', { availability_status: status });
      set(state => ({
        volunteer: state.volunteer ? { ...state.volunteer, availability_status: status } : null
      }));
    } catch {}
  },

  updateTaskStatus: async (task_id, status) => {
    const res = await api.put(`/volunteer/tasks/${task_id}/status`, { status });
    if (res.data.success) {
      set(state => ({
        activeTask: state.activeTask ? { ...state.activeTask, status } : null
      }));
    }
  },

  verifyOtp: async (task_id, otp) => {
    const res = await api.post(`/volunteer/tasks/${task_id}/verify-otp`, { otp });
    if (res.data.success) {
      set(state => ({
        activeTask: state.activeTask ? { ...state.activeTask, status: 'otp_verified' } : null
      }));
    }
    return res.data;
  },

  completeTask: async (task_id, data) => {
    const res = await api.post(`/volunteer/tasks/${task_id}/complete`, data);
    if (res.data.success) {
      set({ activeTask: null });
      get().fetchTaskHistory();
    }
    return res.data;
  },

  pingLocation: async (data) => {
    try {
      await api.post('/volunteer/location', data);
    } catch {}
  },

  sendMessage: async (task_id, message, type = 'text') => {
    const res = await api.post(`/volunteer/chat/${task_id}`, { message, message_type: type });
    if (res.data.success) {
      set(state => ({ chatMessages: [...state.chatMessages, res.data.data] }));
    }
  },
}));
