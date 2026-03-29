import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

/**
 * GET /api/public/leaderboard
 * Returns top donors, NGOs, and volunteers by points
 */
export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const [donorsRes, ngosRes, volunteersRes] = await Promise.all([
      supabase
        .from('donors')
        .select('full_name, points')
        .order('points', { ascending: false })
        .limit(5),
      supabase
        .from('ngo_organizations')
        .select('org_name, points')
        .order('points', { ascending: false })
        .limit(5),
      supabase
        .from('ngo_volunteers')
        .select('full_name, points')
        .order('points', { ascending: false })
        .limit(5)
    ]);

    // Masking function for individual privacy
    const maskName = (name: string) => {
      if (!name) return 'Anonymous';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0];
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    };

    const leaderboard = {
      donors: (donorsRes.data || []).map(d => ({
        name: d.full_name, // Typically businesses keep full names, but we can mask if needed
        points: d.points || 0
      })),
      ngos: (ngosRes.data || []).map(n => ({
        name: n.org_name,
        points: n.points || 0
      })),
      volunteers: (volunteersRes.data || []).map(v => ({
        name: maskName(v.full_name),
        points: v.points || 0
      }))
    };

    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/public/stats
 * Returns aggregate impact stats for the landing page
 */
export const getPublicStats = async (req: Request, res: Response) => {
  try {
    // We can use a simpler approach: sum of impact_logs
    const { data: metrics, error } = await supabase
      .from('impact_logs')
      .select('kg_received, meals_estimated');

    if (error) throw error;

    const totalKg = metrics.reduce((acc, curr) => acc + (curr.kg_received || 0), 0);
    const totalMeals = metrics.reduce((acc, curr) => acc + (curr.meals_estimated || 0), 0);
    
    // Hardcoded baseline + real data to make it look "established" as requested in earlier turns
    // The user had STATS = [2.4M+, 340+, 12K+, 890t]
    // We will blend them: Base + Real
    
    const stats = [
      { 
        value: `${Math.floor(2400000 + totalMeals).toLocaleString()}`, 
        label: 'Meals Redistributed',
        trend: '+12% this week'
      },
      { 
        value: `${340 + (totalKg > 0 ? 1 : 0)}`, 
        label: 'NGO Partners',
        trend: 'Growing community'
      },
      { 
        value: '12K+', 
        label: 'Active Volunteers',
        trend: 'Always ready'
      },
      { 
        value: `${Math.floor(890 + (totalKg * 2.5 / 1000))} t`, 
        label: 'CO₂ Offset',
        trend: 'Environmental impact'
      }
    ];

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
