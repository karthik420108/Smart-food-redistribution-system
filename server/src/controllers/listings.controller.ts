import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

export const getListings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    let query = supabase.from('food_listings').select('*, donors(full_name, address, lat, lng)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    res.status(200).json({ success: true, data, count, page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ success: false, error: 'Unauthorized' });
       return;
    }

    // Get donor id and location
    const { data: donor } = await supabase.from('donors').select('id, lat, lng, full_name').eq('user_id', userId).single();
    if (!donor) {
       res.status(404).json({ success: false, error: 'Donor profile not found' });
       return;
    }

    const { 
        title, 
        description, 
        category, 
        quantity, 
        quantity_unit, 
        expiry_datetime,
        pickup_from,
        pickup_to,
        pickup_address,
        lat,
        lng,
        images,
        is_urgent
    } = req.body;

    const listingData = { 
        donor_id: donor.id,
        title,
        description,
        category,
        quantity,
        quantity_unit,
        expiry_datetime,
        pickup_from,
        pickup_to,
        pickup_address,
        lat: lat || donor.lat,
        lng: lng || donor.lng,
        images: images || [],
        is_urgent: is_urgent || false,
        status: 'available'
    };
    
    const { data: listing, error: createError } = await supabase.from('food_listings').insert(listingData).select().single();

    if (createError) throw createError;

    // --- SMART DISTRIBUTION ALGORITHM ---
    // 1. Find nearby receivers (within 10km) using the RPC we created
    const { data: nearbyReceivers } = await supabase.rpc('get_nearby_receivers', {
        listing_lat: listing.lat,
        listing_lng: listing.lng,
        radius_meters: 10000 // 10km radius
    });

    if (nearbyReceivers && nearbyReceivers.length > 0) {
        // 2. Create in-app notifications for them
        const notifications = nearbyReceivers.map((r: any) => ({
            user_id: r.user_id,
            type: 'new_listing',
            message: `New food available nearby from ${donor.full_name || 'a local donor'}: ${listing.title}`,
            metadata: { 
                listing_id: listing.id, 
                distance_km: Math.round(r.dist_meters / 100) / 10 
            }
        }));

        await supabase.from('notifications').insert(notifications);
    }

    res.status(201).json({ success: true, data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getListingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('food_listings').select('*, donors(full_name, phone, address)').eq('id', id).single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('food_listings').update(req.body).eq('id', id).select().single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('food_listings').delete().eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
