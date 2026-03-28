import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  loading: boolean;
  fetchListings: () => Promise<void>;
  updateListingStatus: (id: string, status: FoodListing['status']) => Promise<void>;
}

export const useListingStore = create<ListingState>((set) => ({
  listings: [],
  loading: true,
  fetchListings: async () => {
    set({ loading: true });
    
    // Only fetch for current session's donor
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (userId) {
       const { data: donor } = await supabase.from('donors').select('id').eq('user_id', userId).single();
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
  updateListingStatus: async (id, status) => {
    const { error } = await supabase.from('food_listings').update({ status }).eq('id', id);
    if (!error) {
       set((state) => ({
         listings: state.listings.map(l => l.id === id ? { ...l, status } : l)
       }));
    }
  }
}));
