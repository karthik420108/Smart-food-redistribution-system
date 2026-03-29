import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

export const createClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ success: false, error: 'Unauthorized' });
       return;
    }

    const { listing_id, quantity_claimed } = req.body;
    const pickup_code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP

    const { data, error } = await supabase.from('claims').insert({
      listing_id,
      receiver_id: userId,
      quantity_claimed,
      pickup_code,
      status: 'pending'
    }).select().single();

    if (error) throw error;

    // We might also update the listing status if quantity is fully claimed here

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyPickup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; // Donor's ID (or User ID to check against donor)
    const { id } = req.params; // Listing ID or Claim ID
    const { pickup_code } = req.body;

    const { data: claim, error: claimError } = await supabase.from('claims').select('*, food_listings(donor_id)').eq('id', id).single();
    if (claimError || !claim) {
      res.status(404).json({ success: false, error: 'Claim not found' });
      return;
    }

    if (claim.pickup_code !== pickup_code) {
      res.status(400).json({ success: false, error: 'Invalid pickup code' });
      return;
    }

    // Verify successful, update claim
    const { data, error } = await supabase.from('claims')
      .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;

    res.status(200).json({ success: true, data, message: 'Pickup verified!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getClaims = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listing_id } = req.query;
    let query = supabase.from('claims').select('*, auth.users(email)');
    
    if (listing_id) {
       query = query.eq('listing_id', listing_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
