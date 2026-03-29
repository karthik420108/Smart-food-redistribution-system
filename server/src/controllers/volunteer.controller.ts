import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';
import { createNotification } from '../utils/notifications';

// ===================== AUTH =====================
export const volunteerSetupPin = async (req: Request, res: Response) => {
  try {
    const { phone, setup_pin, new_password } = req.body;

    // Find volunteer by phone + setup_pin
    const { data: volunteer, error } = await supabase
      .from('ngo_volunteers')
      .select('*')
      .eq('phone', phone)
      .eq('setup_pin', setup_pin)
      .eq('setup_pin_used', false)
      .single();

    if (error || !volunteer) {
      res.status(400).json({ success: false, error: 'Invalid phone number or setup PIN' });
      return;
    }

    // Update password in auth
    if (volunteer.user_id && new_password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(volunteer.user_id, {
        password: new_password
      });
      if (pwError) throw pwError;
    }

    // Mark PIN as used
    await supabase.from('ngo_volunteers')
      .update({ setup_pin_used: true, updated_at: new Date().toISOString() })
      .eq('id', volunteer.id);

    res.json({ success: true, message: 'Password set successfully. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== VOLUNTEER PROFILE =====================
export const getMyVolunteerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ngo_volunteers')
      .select(`
        *,
        ngo_organizations(id, org_name, logo_url, primary_address)
      `)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Volunteer profile not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVolunteerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id').eq('user_id', req.user.id).single();

    const allowedFields = ['profile_photo_url', 'whatsapp', 'address', 'vehicle_type', 'vehicle_number'];
    const updateData: any = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    const { data, error } = await supabase
      .from('ngo_volunteers')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', (v as any)?.id)
      .select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== AVAILABILITY =====================
export const updateAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { availability_status } = req.body;
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id, ngo_id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('ngo_volunteers')
      .update({ availability_status, updated_at: new Date().toISOString() })
      .eq('id', (v as any)?.id)
      .select().single();

    if (error) throw error;

    // Log availability change
    await supabase.from('volunteer_availability_logs').insert({
      volunteer_id: (v as any)?.id,
      status: availability_status,
    });

    // Notify NGO
    io.to(`ngo_${(v as any)?.ngo_id}`).emit('volunteer_availability_changed', {
      volunteer_id: (v as any)?.id,
      availability_status,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== TASKS (VOLUNTEER VIEW) =====================
export const getActiveTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .select(`
        *,
        ngo_food_claims(id, pickup_otp, quantity_claimed, quantity_unit, notes,
          food_listings(title, images, category, expiry_datetime, pickup_address, lat, lng, tags)),
        ngo_organizations(org_name, primary_address)
      `)
      .eq('volunteer_id', (v as any)?.id)
      .in('status', ['assigned','accepted','en_route_pickup','arrived_at_pickup','otp_verified','picked_up','en_route_delivery'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVolunteerTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .select(`
        *,
        ngo_food_claims(quantity_claimed, quantity_unit, food_listings(title, images, category))
      `)
      .eq('volunteer_id', (v as any)?.id)
      .order('created_at', { ascending: false });

    if (error) {
       console.error('getActiveTasks Error:', error);
       throw error;
    }
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('getActiveTasks Catch Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTaskDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .select(`
        *,
        ngo_food_claims(id, pickup_otp, quantity_claimed, quantity_unit, notes,
          food_listings(*, donors(full_name, phone, whatsapp, address))),
        ngo_organizations(org_name, primary_address, primary_lat, primary_lng, phone)
      `)
      .eq('id', id)
      .eq('volunteer_id', (v as any)?.id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['accepted','en_route_pickup','arrived_at_pickup','picked_up','en_route_delivery','delivered'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const timestamps: any = {};
    if (status === 'accepted') timestamps.accepted_at = new Date().toISOString();
    if (status === 'arrived_at_pickup') timestamps.arrived_pickup_at = new Date().toISOString();
    if (status === 'picked_up') timestamps.picked_up_at = new Date().toISOString();
    if (status === 'delivered') timestamps.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .update({ status, ...timestamps, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, ngo_id, volunteer_id')
      .single();

    if (error) throw error;

    // Also update claim status
    const claimStatusMap: any = {
      'en_route_pickup': 'volunteer_en_route',
      'arrived_at_pickup': 'arrived_at_donor',
      'picked_up': 'picked_up',
      'en_route_delivery': 'in_transit',
      'delivered': 'delivered',
    };
    if (claimStatusMap[status] && (data as any).claim_id) {
      await supabase.from('ngo_food_claims')
        .update({ status: claimStatusMap[status], updated_at: new Date().toISOString() })
        .eq('id', (data as any).claim_id);
    }

    // Notify NGO
    io.to(`ngo_${(data as any).ngo_id}`).emit('task_status_updated', { task_id: id, status, volunteer_id: (data as any).volunteer_id });

    // Notify Donor
    const { data: claimData } = await supabase.from('ngo_food_claims').select('food_listings(donor_id)').eq('id', (data as any).claim_id).single();
    const donorId = (claimData as any)?.food_listings?.donor_id;
    if (donorId) {
      io.to(`donor_${donorId}`).emit('task_status_changed', { task_id: id, status });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    // Get the claim OTP via task
    const { data: task } = await supabase
      .from('volunteer_tasks')
      .select('claim_id, ngo_id, volunteer_id')
      .eq('id', id)
      .single();

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    const { data: claim } = await supabase
      .from('ngo_food_claims')
      .select('pickup_otp, pickup_otp_verified, listing_id, food_listings(donor_id)')
      .eq('id', (task as any).claim_id)
      .single();

    if (!claim) {
      res.status(404).json({ success: false, error: 'Claim not found' });
      return;
    }

    if ((claim as any).pickup_otp !== otp) {
      res.status(400).json({ success: false, error: 'Incorrect OTP' });
      return;
    }

    // Mark OTP verified
    await supabase.from('ngo_food_claims')
      .update({ 
        pickup_otp_verified: true, 
        status: 'picked_up', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', (task as any).claim_id);

    // Update task status
    await supabase.from('volunteer_tasks')
      .update({ status: 'otp_verified', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Get claim quantity for points
    const { data: claimDetails } = await supabase
      .from('ngo_food_claims')
      .select('quantity_claimed')
      .eq('id', (task as any).claim_id)
      .single();

    const kg = (claimDetails as any)?.quantity_claimed || 1;
    const pointsAwarded = Math.round(kg * 10); // Donor gets 10 pts per kg
    const volunteerPoints = 5; // Fixed per task for now
    const ngoPoints = 50; // Fixed per successful collection

    // Update food listing status to 'completed' for the donor's cycle
    // Note: In a multi-claim scenario, we should check if all portions are picked up.
    await supabase.from('food_listings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', (claim as any).listing_id);

    // Award Points - Use RPC for atomic updates
    const donorIdFromListing = (claim as any).food_listings?.donor_id;
    if (donorIdFromListing) {
       // Get actual user_id from donor table first
       const { data: donorOrg } = await supabase.from('donors').select('user_id').eq('id', donorIdFromListing).single();
       if (donorOrg?.user_id) {
         await supabase.rpc('award_points', { 
           user_id_val: donorOrg.user_id, 
           points_val: pointsAwarded, 
           target_table: 'donors' 
         });
       }
    }

    // Award points to NGO and Volunteer
    const { data: ngoProfile } = await supabase.from('ngo_organizations').select('user_id').eq('id', (task as any).ngo_id).single();
    if (ngoProfile?.user_id) {
      await supabase.rpc('award_points', { 
        user_id_val: ngoProfile.user_id, 
        points_val: ngoPoints, 
        target_table: 'ngo_organizations' 
      });
    }

    const { data: volProfile } = await supabase.from('ngo_volunteers').select('user_id').eq('id', (task as any).volunteer_id).single();
    if (volProfile?.user_id) {
      await supabase.rpc('award_points', { 
        user_id_val: volProfile.user_id, 
        points_val: volunteerPoints, 
        target_table: 'ngo_volunteers' 
      });
    }

    // Real-time Persistent Notifications
    Promise.all([
        // To NGO
        createNotification({
            userId: (task as any).ngo_id,
            type: 'otp_verified',
            message: `OTP verified for task #${(id as string).split('-')[0]}. Food is officially picked up!`,
            metadata: { task_id: id, role: 'ngo', points_earned: ngoPoints }
        }),
        // To Donor
        donorIdFromListing ? createNotification({
            userId: donorIdFromListing,
            type: 'otp_verified',
            message: `Food picked up! Your donation of "${(claim as any).food_listings?.title || 'food'}" is now in transit.`,
            metadata: { listing_id: (claim as any).listing_id, role: 'donor', points_earned: pointsAwarded }
        }) : Promise.resolve()
    ]).catch(err => console.error('Pickup notification error:', err));

    res.json({ success: true, message: 'OTP verified successfully!', points_awarded: pointsAwarded });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completeTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { actual_kg_collected, food_condition, volunteer_note } = req.body;

    const { data: task, error } = await supabase
      .from('volunteer_tasks')
      .update({
        status: 'completed',
        actual_kg_collected,
        volunteer_note,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, ngo_id, volunteer_id, claim_id')
      .single();

    if (error) throw error;

    // Mark claim delivered
    await supabase.from('ngo_food_claims')
      .update({ status: 'completed', actual_quantity_received: actual_kg_collected, updated_at: new Date().toISOString() })
      .eq('id', (task as any).claim_id);

    // Free volunteer
    await supabase.from('ngo_volunteers')
      .update({ availability_status: 'available', total_tasks_completed: supabase.rpc as any, updated_at: new Date().toISOString() })
      .eq('id', (task as any).volunteer_id);

    // Auto-insert impact log
    await supabase.from('impact_logs').insert({
      ngo_id: (task as any).ngo_id,
      task_id: id,
      claim_id: (task as any).claim_id,
      volunteer_id: (task as any).volunteer_id,
      kg_received: actual_kg_collected,
      meals_estimated: Math.floor(actual_kg_collected * 2.5),
      food_condition,
    });

    // Update volunteer totals
    await supabase.rpc('increment_volunteer_stats', {
      p_volunteer_id: (task as any).volunteer_id,
      p_kg: actual_kg_collected,
    }).maybeSingle();

    // Real-time Persistent Notifications
    Promise.all([
        // To NGO
        createNotification({
            userId: (task as any).ngo_id,
            type: 'task_status_changed',
            message: `Redistribution Complete! ${actual_kg_collected}kg has been delivered.`,
            metadata: { task_id: id, role: 'ngo', status: 'completed' }
        }),
        // To Donor (Implicit via global stats usually, but nice to notify)
        createNotification({
            userId: (task as any).listing_snapshot?.donor_id || '',
            type: 'points_awarded',
            message: `Success! Your donation has reached its destination. Thank you for your impact!`,
            metadata: { role: 'donor', impact_kg: actual_kg_collected }
        }).catch(() => {}) // Fallback if donor_id missing in snapshot
    ]).catch(err => console.error('Completion notification error:', err));

    res.json({ success: true, data: task, meals_estimated: Math.floor(actual_kg_collected * 2.5) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== LOCATION PING =====================
export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: v } = await supabase
      .from('ngo_volunteers').select('id, ngo_id').eq('user_id', req.user.id).single();

    const { task_id, lat, lng, speed_kmph, heading, accuracy_meters } = req.body;

    // Update volunteer's current position
    await supabase.from('ngo_volunteers')
      .update({ current_lat: lat, current_lng: lng, last_location_update: new Date().toISOString() })
      .eq('id', (v as any)?.id);

    // Log the position
    await supabase.from('volunteer_location_logs').insert({
      volunteer_id: (v as any)?.id,
      task_id,
      lat, lng, speed_kmph, heading, accuracy_meters,
    });

    // Broadcast to NGO's room for live tracking map
    io.to(`ngo_${(v as any)?.ngo_id}`).emit('volunteer_location_update', {
      volunteer_id: (v as any)?.id,
      task_id,
      lat, lng,
    });

    // Also notify donor if a task_id is present
    if (task_id) {
        const { data: taskData } = await supabase
            .from('volunteer_tasks')
            .select('ngo_food_claims(food_listings(donor_id))')
            .eq('id', task_id)
            .single();
        
        const donorId = (taskData as any)?.ngo_food_claims?.food_listings?.donor_id;
        if (donorId) {
            io.to(`donor_${donorId}`).emit('volunteer_location_update', {
                volunteer_id: (v as any)?.id,
                task_id,
                lat, lng
            });
        }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== CHAT =====================
export const getChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_id } = req.params;
    const { data, error } = await supabase
      .from('task_messages').select('*').eq('task_id', task_id).order('created_at');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_id } = req.params;
    const { message, message_type = 'text', metadata = {} } = req.body;

    const { data, error } = await supabase.from('task_messages').insert({
      task_id,
      sender_id: req.user.id,
      sender_role: 'volunteer',
      message, message_type, metadata,
    }).select().single();

    if (error) throw error;

    io.to(`task_${task_id}`).emit('new_message', data);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
