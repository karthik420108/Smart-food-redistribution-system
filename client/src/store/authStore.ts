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
  setUser: (user: User | null) => void;
  setDonorProfile: (profile: DonorProfile | null) => void;
  initialize: () => Promise<void>;
  loginSuccess: (user: User, profile: DonorProfile, session: any) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  donorProfile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setDonorProfile: (profile) => set({ donorProfile: profile }),
  loginSuccess: async (user, profile, _session) => {
    set({ user, donorProfile: profile, loading: false });
  },
  initialize: async () => {
    set({ loading: true });
    
    // Check active session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      set({ user: session.user });
      
      // Fetch donor profile
      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        set({ donorProfile: data as DonorProfile });
      }
    }
    
    set({ loading: false });

    // Listen to changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        const { data } = await supabase
          .from('donors')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        set({ donorProfile: data as DonorProfile });
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
