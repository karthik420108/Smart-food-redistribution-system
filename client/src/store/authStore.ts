import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface DonorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  pincode?: string;
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  donor_type: 'individual' | 'business';
  fssai_number?: string;
  gst_number?: string;
  selfie_url?: string;
  lat?: number;
  lng?: number;
  rating: number;
  total_donations: number;
  operating_hours?: any;
}

interface AuthState {
  user: User | null;
  donorProfile: DonorProfile | null;
  loading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setDonorProfile: (profile: DonorProfile | null) => void;
  initialize: () => Promise<void>;
  loginSuccess: (user: User, profile: DonorProfile, session: any) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  donorProfile: null,
  loading: true,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setDonorProfile: (profile) => set({ donorProfile: profile }),
  loginSuccess: async (user, profile, _session) => {
    set({ user, donorProfile: profile, loading: false });
  },
  initialize: async () => {
    // Only initialize once
    if (get().isInitialized) return;
    
    set({ loading: true, isInitialized: true });
    
    // Check active session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      set({ user: session.user });
      
      // Only fetch donor profile if user is a donor
      const role = session.user.user_metadata?.role;
      if (role !== 'ngo_admin' && role !== 'ngo_volunteer') {
        const { data, error } = await supabase
          .from('donors')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(1);
          
        if (data && data.length > 0 && !error) {
          set({ donorProfile: data[0] as DonorProfile });
        }
      }
    }
    
    set({ loading: false });

    // Listen to changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        // Skip donor fetch for NGO/Volunteer roles
        const role = session.user.user_metadata?.role;
        if (role !== 'ngo_admin' && role !== 'ngo_volunteer') {
          const { data, error } = await supabase
            .from('donors')
            .select('*')
            .eq('user_id', session.user.id)
            .limit(1);
            
          if (data && data.length > 0 && !error) {
            set({ donorProfile: data[0] as DonorProfile });
          } else {
            set({ donorProfile: null });
          }
        }
      } else {
        set({ donorProfile: null });
      }
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, donorProfile: null });
  }
}));
