import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

export const getOverviewStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ success: false, error: 'Unauthorized' });
       return;
    }

    // Get donor record
    const { data: donor } = await supabase.from('donors').select('id').eq('user_id', userId).single();
    if (!donor) {
       res.status(404).json({ success: false, error: 'Donor profile not found' });
       return;
    }

    // 1. Total Food Saved (kg) - from completed claims
    const { data: completedClaims, error: claimsError } = await supabase
      .from('claims')
      .select('quantity_claimed, food_listings!inner(donor_id)')
      .eq('status', 'picked_up')
      .eq('food_listings.donor_id', donor.id);

    if (claimsError) throw claimsError;

    const totalSavedKg = completedClaims.reduce((acc, curr) => acc + (curr.quantity_claimed || 0), 0);

    // 2. Meals Provided (Approx 1 meal = 0.5kg)
    const mealsProvided = Math.round(totalSavedKg / 0.5);

    // 3. NGOs Helped (Unique receivers)
    const { data: uniqueReceivers } = await supabase
        .from('claims')
        .select('receiver_id', { count: 'exact', head: true })
        .eq('food_listings.donor_id', donor.id)
        .eq('status', 'picked_up');
    
    // 4. Listing Status distribution
    const { data: statusCounts } = await supabase
        .from('food_listings')
        .select('status')
        .eq('donor_id', donor.id);
    
    const stats = {
        totalSavedKg,
        mealsProvided,
        ngosHelped: uniqueReceivers?.length || 0,
        co2Offset: Math.round(totalSavedKg * 2.5), // Approx 2.5kg CO2 per kg food waste
        statusDistribution: {
            available: statusCounts?.filter(l => l.status === 'available').length || 0,
            claimed: statusCounts?.filter(l => l.status === 'claimed').length || 0,
            completed: statusCounts?.filter(l => l.status === 'completed').length || 0,
            expired: statusCounts?.filter(l => l.status === 'expired').length || 0,
        }
    };

    res.status(200).json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getWeeklyDonations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { data: donor } = await supabase.from('donors').select('id').eq('user_id', userId).single();
    
    if (!donor) {
       res.status(404).json({ success: false, error: 'Donor not found' });
       return;
    }

    // Fetch last 7 days of completed donations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activity } = await supabase
        .from('claims')
        .select('quantity_claimed, created_at, food_listings!inner(donor_id)')
        .eq('food_listings.donor_id', donor.id)
        .eq('status', 'picked_up')
        .gte('created_at', sevenDaysAgo.toISOString());

    // Group by day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map(day => ({ name: day, kg: 0 }));

    activity?.forEach(item => {
        const dayName = days[new Date(item.created_at).getDay()];
        const dayObj = result.find(d => d.name === dayName);
        if (dayObj) dayObj.kg += item.quantity_claimed;
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
