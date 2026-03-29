import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import api from '../lib/api';

export interface FoodListing {
  id: string;
  donor_id: string;
  title: string;
  description?: string;
  category: 'cooked_food' | 'raw_produce' | 'packaged' | 'beverages' | 'other';
  quantity: number;
  quantity_unit: string;
  expiry_datetime: string;
  pickup_from?: string;
  pickup_to?: string;
  pickup_address?: string;
  lat?: number;
  lng?: number;
  images: string[];
  status: 'available' | 'claimed' | 'partially_claimed' | 'completed' | 'expired' | 'cancelled';
  is_urgent: boolean;
  tags: string[];
  ai_generated_description?: string;
  created_at: string;
}

interface ListingState {
  listings: FoodListing[];
  claims: any[];
  loading: boolean;
  fetchListings: () => Promise<void>;
  fetchClaims: () => Promise<void>;
  updateListingStatus: (id: string, status: FoodListing['status']) => Promise<void>;
}

export const useListingStore = create<ListingState>((set) => ({
  listings: [],
  claims: [],
  loading: true,
  fetchListings: async () => {
    set({ loading: true });
    
    const user = useAuthStore.getState().user;
    const userId = user?.id;
    
    if (userId) {
       const { data: donor } = await supabase.from('donors').select('id').eq('user_id', userId).maybeSingle();
       if (donor) {
           const { data } = await supabase
              .from('food_listings')
              .select('*')
              .eq('donor_id', donor.id)
              .order('created_at', { ascending: false });
              
           if (data) set({ listings: data as FoodListing[] });
       }
    }
    
    set({ loading: false });
  },
  fetchClaims: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/donors/claims');
      if (response.data?.success) {
        set({ claims: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching donor claims:', error);
    } finally {
      set({ loading: false });
    }
  },
  updateListingStatus: async (id, status) => {
    const { error } = await supabase.from('food_listings').update({ status }).eq('id', id);
    if (!error) {
       set((state) => ({
         listings: state.listings.map(l => l.id === id ? { ...l, status } : l)
       }));
    }
  }
}));
