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
    const { data: donor } = await supabase.from('donors').select('*').eq('user_id', userId).single();
    if (!donor) {
       // Return empty stats
       return res.status(200).json({ 
         success: true, 
         data: {
           totalSavedKg: 0,
           mealsProvided: 0,
           ngosHelped: 0,
           co2Offset: 0,
           points: 0,
           statusDistribution: { available: 0, claimed: 0, completed: 0, expired: 0 },
           nearbyActivity: []
         } 
       });
    }

    // 1. Total Food Saved (kg) - from completed claims
    const { data: completedClaims, error: claimsError } = await supabase
      .from('ngo_food_claims')
      .select('quantity_claimed, food_listings!inner(donor_id)')
      .eq('status', 'completed')
      .eq('food_listings.donor_id', donor.id);

    if (claimsError) throw claimsError;

    const totalSavedKg = completedClaims.reduce((acc, curr) => acc + (curr.quantity_claimed || 0), 0);

    // 2. Meals Provided (Approx 1 meal = 0.5kg)
    const mealsProvided = Math.round(totalSavedKg / 0.5);

    // 3. NGOs Helped (Unique NGOs)
    const { data: claimsForCount } = await supabase
        .from('ngo_food_claims')
        .select('ngo_id')
        .eq('food_listings.donor_id', donor.id)
        .eq('status', 'completed');
    
    const uniqueNgos = new Set(claimsForCount?.map(c => c.ngo_id)).size;
    
    // 4. Listing Status distribution
    const { data: statusCounts } = await supabase
        .from('food_listings')
        .select('status')
        .eq('donor_id', donor.id);
    
    // 5. Nearby Activity (Recent and nearby NGOs)
    const { data: ngos } = await supabase
        .from('ngo_organizations')
        .select('primary_lat, primary_lng, org_name')
        .limit(10);

    const nearbyActivity = ngos?.map(n => ({
        lat: n.primary_lat,
        lng: n.primary_lng,
        label: n.org_name,
        type: 'ngo'
    })) || [];

    const stats = {
        totalSavedKg,
        mealsProvided,
        ngosHelped: uniqueNgos,
        co2Offset: Math.round(totalSavedKg * 2.5),
        points: donor.points || 0,
        statusDistribution: {
            available: statusCounts?.filter(l => l.status === 'available').length || 0,
            claimed: statusCounts?.filter(l => ['claimed','assigned','picked_up'].includes(l.status)).length || 0,
            completed: statusCounts?.filter(l => l.status === 'completed').length || 0,
            expired: statusCounts?.filter(l => l.status === 'expired').length || 0,
        },
        nearbyActivity
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
       return res.status(200).json({ success: true, data: [] });
    }

    // Fetch last 7 days of completed donations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activity } = await supabase
        .from('ngo_food_claims')
        .select('quantity_claimed, created_at, food_listings!inner(donor_id)')
        .eq('food_listings.donor_id', donor.id)
        .eq('status', 'completed')
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

export const getDetailedDonorImpact = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { data: donor } = await supabase.from('donors').select('id').eq('user_id', userId).single();
    if (!donor) return res.status(200).json({ success: true, data: [] });

    // 1. Fetch History of all listings for this donor
    const { data: listings, error } = await supabase
      .from('food_listings')
      .select(`
        id, title, status, quantity, quantity_unit, created_at, category,
        claims:ngo_food_claims(
          id, status, quantity_claimed, updated_at,
          ngo:ngo_organizations(org_name)
        )
      `)
      .eq('donor_id', donor.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Aggregate impact metrics
    const totals = {
      completed_count: 0,
      expired_count: 0,
      active_count: 0,
      completed_kg: 0,
      expired_kg: 0,
      active_kg: 0,
      impact_score: 0
    };

    listings?.forEach(l => {
      const kg = l.quantity || 0;
      if (l.status === 'completed') {
        totals.completed_count++;
        totals.completed_kg += kg;
        totals.impact_score += kg * 10;
      } else if (l.status === 'expired') {
        totals.expired_count++;
        totals.expired_kg += kg;
        totals.impact_score -= kg * 2;
      } else {
        totals.active_count++;
        totals.active_kg += kg;
      }
    });

    const totalCount = listings?.length || 0;
    const successRate = totalCount > 0 ? (totals.completed_count / (totals.completed_count + totals.expired_count || 1)) * 100 : 100;

    res.status(200).json({ 
      success: true, 
      data: {
        listings,
        totals: {
          ...totals,
          success_rate: Math.min(100, Math.round(successRate * 10) / 10),
          co2_saved: Math.round(totals.completed_kg * 2.5),
          meals_equivalent: Math.round(totals.completed_kg / 0.5),
          rank: totals.impact_score > 500 ? 'Silver' : totals.impact_score > 100 ? 'Bronze' : 'Rookie'
        }
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
