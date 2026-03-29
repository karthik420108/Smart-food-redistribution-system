import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';
import crypto from 'crypto';

// ===================== REGISTRATION =====================
export const registerNgo = async (req: Request, res: Response) => {
  try {
    const {
      email, password, org_name, org_type, registration_number, fssai_number,
      contact_person, designation, phone, whatsapp,
      primary_address, primary_lat, primary_lng, service_radius_km,
      dietary_restrictions, food_type_preferences, beneficiary_count,
      peak_meal_times, bio, website, social_links,
      distribution_centers, who_served
    } = req.body;

    // Create auth user with ngo_admin role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { role: 'ngo_admin', org_name, contact_person }
    });

    if (authError) {
      res.status(400).json({ success: false, error: authError.message });
      return;
    }

    const userId = authData.user.id;

    // Insert NGO org record
    const { data: ngo, error: ngoError } = await supabase
      .from('ngo_organizations')
      .insert({
        user_id: userId,
        org_name, org_type, registration_number, fssai_number,
        contact_person, designation, email, phone, whatsapp,
        primary_address, primary_lat: primary_lat || 12.9716, primary_lng: primary_lng || 77.5946,
        service_radius_km: service_radius_km || 10,
        dietary_restrictions: dietary_restrictions || [],
        food_type_preferences: food_type_preferences || [],
        beneficiary_count: beneficiary_count || 0,
        peak_meal_times: peak_meal_times || {},
        bio, website, social_links: social_links || {},
        status: 'pending_verification',
      })
      .select()
      .single();

    if (ngoError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      res.status(400).json({ success: false, error: ngoError.message });
      return;
    }

    // Insert primary distribution center if provided
    if (distribution_centers && distribution_centers.length > 0) {
      const centers = distribution_centers.map((c: any, i: number) => ({
        ngo_id: ngo.id,
        label: c.label || `Center ${i + 1}`,
        address: c.address || primary_address,
        lat: c.lat || primary_lat || 12.9716,
        lng: c.lng || primary_lng || 77.5946,
        is_primary: i === 0,
        capacity_kg: c.capacity_kg || null,
        operating_hours: c.operating_hours || {},
      }));
      await supabase.from('ngo_locations').insert(centers);
    } else {
      // Insert primary as default center
      await supabase.from('ngo_locations').insert({
        ngo_id: ngo.id,
        label: 'Main Center',
        address: primary_address,
        lat: primary_lat || 12.9716,
        lng: primary_lng || 77.5946,
        is_primary: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'NGO registered successfully. Account pending verification.',
      data: { ngo_id: ngo.id, status: ngo.status }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== LOGIN =====================
export const loginNgo = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('NGO Login Error [Supabase Auth]:', error.message);
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    // Parallelize profile fetches for NGO and Volunteer
    const [ngoRes, volunteerRes] = await Promise.all([
      supabase.from('ngo_organizations').select('*').eq('user_id', data.user.id).single(),
      supabase.from('ngo_volunteers').select('*, ngo_organizations(org_name)').eq('user_id', data.user.id).single()
    ]);

    const ngo = ngoRes.data;
    const volunteer = volunteerRes.data;

    const role = ngo ? 'ngo_admin' : volunteer ? 'ngo_volunteer' : 'unknown';

    res.json({
      success: true,
      data: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user,
        ngo: ngo || null,
        volunteer: volunteer || null,
        role
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== GET OWN NGO =====================
export const getMyNgo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ngo_organizations')
      .select('*, ngo_locations(*)')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'NGO not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== UPDATE NGO PROFILE =====================
export const updateMyNgo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!ngo) {
      res.status(404).json({ success: false, error: 'NGO not found' });
      return;
    }

    const allowedFields = [
      'org_name', 'bio', 'website', 'social_links', 'phone', 'whatsapp',
      'dietary_restrictions', 'food_type_preferences', 'beneficiary_count',
      'peak_meal_times', 'service_radius_km', 'logo_url', 'cover_photo_url',
      'primary_address', 'primary_lat', 'primary_lng',
    ];

    const updateData: any = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ngo_organizations')
      .update(updateData)
      .eq('id', ngo.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== LOCATIONS =====================
export const getLocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('ngo_locations').select('*').eq('ngo_id', ngo?.id).order('created_at');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase.from('ngo_locations').insert({
      ngo_id: ngo?.id,
      ...req.body,
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('ngo_locations').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('ngo_locations').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Location deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== CLAIMS =====================
export const getClaims = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { status } = req.query;
    let query = supabase
      .from('ngo_food_claims')
      .select(`
        *,
        food_listings(id, title, food_type, quantity, quantity_unit, expiry_time, pickup_address, images, is_urgent),
        ngo_locations(label, address),
        volunteer_tasks(id, volunteer_id, status, volunteer:ngo_volunteers(id, full_name, phone, profile_photo_url, availability_status))
      `)
      .eq('ngo_id', ngo?.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id, status').eq('user_id', req.user.id).single();

    if (ngo?.status !== 'verified') {
      res.status(403).json({ success: false, error: 'NGO must be verified to claim food' });
      return;
    }

    const { listing_id, quantity_claimed, quantity_unit, destination_location_id, notes } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase.from('ngo_food_claims').insert({
      ngo_id: ngo.id,
      listing_id,
      quantity_claimed,
      quantity_unit: quantity_unit || 'kg',
      destination_location_id,
      notes,
      pickup_otp: otp,
      status: 'pending_assignment',
    }).select(`
      *,
      food_listings(title, pickup_address, pickup_lat, pickup_lng, expiry_time, images)
    `).single();

    if (error) throw error;

    // Decrement listing quantity
    await supabase.rpc('decrement_listing_quantity', {
      p_listing_id: listing_id,
      p_amount: quantity_claimed
    }).maybeSingle();

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const { data, error } = await supabase
      .from('ngo_food_claims')
      .update({ status: 'cancelled', cancellation_reason, cancelled_by: 'ngo', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logImpact = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { id } = req.params;
    const { kg_received, meals_estimated, people_served_estimate, food_condition, food_category, notes } = req.body;

    // Get claim details
    const { data: claim } = await supabase
      .from('ngo_food_claims').select('*, volunteer_tasks(id, volunteer_id)').eq('id', id).single();

    const task = (claim as any)?.volunteer_tasks?.[0];

    const { data, error } = await supabase.from('impact_logs').insert({
      ngo_id: ngo?.id,
      claim_id: id,
      task_id: task?.id || null,
      volunteer_id: task?.volunteer_id || null,
      kg_received,
      meals_estimated: meals_estimated || Math.floor(kg_received * 2.5),
      people_served_estimate,
      food_condition,
      food_category,
      notes,
    }).select().single();

    if (error) throw error;

    // Update NGO total kg
    await supabase.from('ngo_organizations')
      .update({ total_kg_received: (ngo as any).total_kg_received + kg_received, updated_at: new Date().toISOString() })
      .eq('id', ngo?.id);

    // Mark claim as completed
    await supabase.from('ngo_food_claims')
      .update({ status: 'completed', actual_quantity_received: kg_received, updated_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== VOLUNTEERS =====================
export const getVolunteers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { status, role, availability_status } = req.query;
    let query = supabase
      .from('ngo_volunteers')
      .select('*')
      .eq('ngo_id', ngo?.id)
      .order('join_date', { ascending: false });

    if (status) query = query.eq('status', status as string);
    if (role) query = query.eq('role', role as string);
    if (availability_status) query = query.eq('availability_status', availability_status as string);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const {
      full_name, phone, whatsapp, email, role, vehicle_type, vehicle_number,
      id_proof_type, emergency_contact_name, emergency_contact_phone, address, notes,
      create_login
    } = req.body;

    let userId: string | null = null;
    let setupPin: string | null = null;

    if (create_login && email) {
      // Generate a 6-digit setup PIN
      setupPin = Math.floor(100000 + Math.random() * 900000).toString();
      const tempPassword = crypto.randomBytes(16).toString('hex');

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'ngo_volunteer', full_name, ngo_id: ngo?.id }
      });

      if (!authError && authUser.user) {
        userId = authUser.user.id;
      }
    }

    const { data, error } = await supabase.from('ngo_volunteers').insert({
      ngo_id: ngo?.id,
      user_id: userId,
      full_name, phone, whatsapp, email,
      role: role || 'volunteer',
      vehicle_type, vehicle_number,
      id_proof_type,
      emergency_contact_name, emergency_contact_phone,
      address, notes,
      setup_pin: setupPin,
      setup_pin_used: false,
    }).select().single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { ...data, setup_pin: setupPin }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('ngo_volunteers')
      .select(`
        *,
        volunteer_tasks(id, status, actual_kg_collected, rating_by_ngo, created_at,
          ngo_food_claims(ngo_food_claims_id:id, food_listings(title)))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('ngo_volunteers')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVolunteerStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('ngo_volunteers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Soft delete
    const { data, error } = await supabase
      .from('ngo_volunteers')
      .update({ status: 'terminated', updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== TASKS =====================
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { status, volunteer_id } = req.query;
    let query = supabase
      .from('volunteer_tasks')
      .select(`
        *,
        volunteer:ngo_volunteers(id, full_name, phone, profile_photo_url, vehicle_type, availability_status, current_lat, current_lng),
        ngo_food_claims(id, pickup_otp, status, quantity_claimed, food_listings(title, images, food_type, expiry_time))
      `)
      .eq('ngo_id', ngo?.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);
    if (volunteer_id) query = query.eq('volunteer_id', volunteer_id as string);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { claim_id, volunteer_id, special_instructions, vehicle_required } = req.body;

    // Get claim and listing details
    const { data: claim } = await supabase
      .from('ngo_food_claims')
      .select(`*, food_listings(*, donors(*))`)
      .eq('id', claim_id).single();

    if (!claim) {
      res.status(404).json({ success: false, error: 'Claim not found' });
      return;
    }

    const listing = (claim as any).food_listings;
    const donor = listing?.donors;

    // Get the destination location
    const { data: destLoc } = await supabase
      .from('ngo_locations')
      .select('*')
      .eq('ngo_id', ngo?.id)
      .eq('is_primary', true)
      .single();

    const now = new Date();
    const windowEnd = listing?.expiry_time ? new Date(listing.expiry_time) : new Date(now.getTime() + 4 * 3600000);

    const { data: task, error } = await supabase.from('volunteer_tasks').insert({
      claim_id,
      ngo_id: ngo?.id,
      volunteer_id,
      assigned_by: req.user.id,
      listing_snapshot: listing || {},
      donor_snapshot: donor || {},
      pickup_address: listing?.pickup_address || '',
      pickup_lat: listing?.pickup_lat || 12.9716,
      pickup_lng: listing?.pickup_lng || 77.5946,
      pickup_window_start: now.toISOString(),
      pickup_window_end: windowEnd.toISOString(),
      delivery_address: destLoc?.address || '',
      delivery_lat: destLoc?.lat || 12.9716,
      delivery_lng: destLoc?.lng || 77.5946,
      vehicle_required: vehicle_required || null,
      special_instructions,
      status: 'assigned',
    }).select(`
      *,
      volunteer:ngo_volunteers(id, full_name, phone)
    `).single();

    if (error) throw error;

    // Update claim status
    await supabase.from('ngo_food_claims')
      .update({ status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', claim_id);

    // Update volunteer availability
    await supabase.from('ngo_volunteers')
      .update({ availability_status: 'on_task', updated_at: new Date().toISOString() })
      .eq('id', volunteer_id);

    // Real-time: Notify volunteer via Socket.io
    io.to(`volunteer_${volunteer_id}`).emit('task_assigned', task);
    // Notify NGO room
    io.to(`ngo_${ngo?.id}`).emit('task_created', task);

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reassignTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { volunteer_id } = req.body;

    // Get old task
    const { data: oldTask } = await supabase.from('volunteer_tasks').select('volunteer_id').eq('id', id).single();

    // Free old volunteer
    if ((oldTask as any)?.volunteer_id) {
      await supabase.from('ngo_volunteers')
        .update({ availability_status: 'available' })
        .eq('id', (oldTask as any).volunteer_id);
    }

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .update({ volunteer_id, status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;

    // Mark new volunteer as on_task
    await supabase.from('ngo_volunteers')
      .update({ availability_status: 'on_task' })
      .eq('id', volunteer_id);

    // Notify new volunteer
    io.to(`volunteer_${volunteer_id}`).emit('task_assigned', data);

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: task } = await supabase.from('volunteer_tasks').select('claim_id, volunteer_id').eq('id', id).single();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;

    // Free claim back to pending
    if ((task as any)?.claim_id) {
      await supabase.from('ngo_food_claims')
        .update({ status: 'pending_assignment', updated_at: new Date().toISOString() })
        .eq('id', (task as any).claim_id);
    }

    // Free volunteer
    if ((task as any)?.volunteer_id) {
      await supabase.from('ngo_volunteers')
        .update({ availability_status: 'available' })
        .eq('id', (task as any).volunteer_id);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rateVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .update({ rating_by_ngo: rating, ngo_feedback: feedback, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;

    // Recalculate volunteer average rating
    const { data: tasks } = await supabase
      .from('volunteer_tasks')
      .select('rating_by_ngo')
      .eq('volunteer_id', (data as any).volunteer_id)
      .not('rating_by_ngo', 'is', null);

    if (tasks && tasks.length > 0) {
      const avg = tasks.reduce((sum: number, t: any) => sum + t.rating_by_ngo, 0) / tasks.length;
      await supabase.from('ngo_volunteers')
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq('id', (data as any).volunteer_id);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== LIVE TRACKING =====================
export const getLiveVolunteers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('ngo_volunteers')
      .select('id, full_name, profile_photo_url, vehicle_type, availability_status, current_lat, current_lng, last_location_update')
      .eq('ngo_id', ngo?.id)
      .eq('status', 'active')
      .neq('availability_status', 'offline');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('volunteer_tasks')
      .select(`
        *,
        volunteer:ngo_volunteers(id, full_name, phone, vehicle_type, current_lat, current_lng, profile_photo_url)
      `)
      .eq('ngo_id', ngo?.id)
      .in('status', ['assigned','accepted','en_route_pickup','arrived_at_pickup','otp_verified','picked_up','en_route_delivery'])
      .order('created_at');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== ANALYTICS =====================
export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    }

    const [impactData, tasksData, claimsData, volunteersData] = await Promise.all([
      supabase.from('impact_logs').select('kg_received, meals_estimated, people_served_estimate, food_category, logged_at')
        .eq('ngo_id', ngo?.id).gte('logged_at', startDate.toISOString()),
      supabase.from('volunteer_tasks').select('status, actual_kg_collected, created_at')
        .eq('ngo_id', ngo?.id).gte('created_at', startDate.toISOString()),
      supabase.from('ngo_food_claims').select('status, quantity_claimed, created_at')
        .eq('ngo_id', ngo?.id),
      supabase.from('ngo_volunteers').select('id, total_tasks_completed, total_kg_collected, rating, availability_status')
        .eq('ngo_id', ngo?.id).eq('status', 'active'),
    ]);

    const totalKg = (impactData.data || []).reduce((s: number, r: any) => s + r.kg_received, 0);
    const totalMeals = (impactData.data || []).reduce((s: number, r: any) => s + (r.meals_estimated || 0), 0);
    const completedTasks = (tasksData.data || []).filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = (tasksData.data || []).filter((t: any) => !['completed', 'cancelled'].includes(t.status)).length;
    const availableVolunteers = (volunteersData.data || []).filter((v: any) => v.availability_status === 'available').length;

    res.json({
      success: true,
      data: {
        total_kg_received: Math.round(totalKg * 10) / 10,
        total_meals_estimated: totalMeals,
        tasks_completed: completedTasks,
        tasks_in_progress: inProgressTasks,
        available_volunteers: availableVolunteers,
        total_volunteers: (volunteersData.data || []).length,
        co2_saved_kg: Math.round(totalKg * 2.5 * 10) / 10,
        food_value_saved_inr: Math.round(totalKg * 50),
        impact_by_category: impactData.data || [],
        tasks_timeline: tasksData.data || [],
        volunteers: volunteersData.data || [],
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== AI FEATURES =====================
export const aiDailyBriefing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('*, ngo_volunteers(id, availability_status), ngo_food_claims(id, status)').eq('user_id', req.user.id).single();

    const pendingClaims = (ngo as any)?.ngo_food_claims?.filter((c: any) => c.status === 'pending_assignment').length || 0;
    const availableVols = (ngo as any)?.ngo_volunteers?.filter((v: any) => v.availability_status === 'available').length || 0;

    // Return a smart briefing without requiring OpenAI key for now
    const briefing = `Good morning! You have ${pendingClaims} claim${pendingClaims !== 1 ? 's' : ''} awaiting volunteer assignment and ${availableVols} volunteer${availableVols !== 1 ? 's' : ''} currently available. ${pendingClaims > 0 && availableVols > 0 ? 'Head to the Task Assignment Board to dispatch your team.' : pendingClaims > 0 ? 'You may need to add more volunteers to your team.' : 'Great work keeping tasks assigned!'}`;

    res.json({ success: true, data: { briefing, pending_claims: pendingClaims, available_volunteers: availableVols } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const aiSuggestAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ngo } = await supabase
      .from('ngo_organizations').select('id').eq('user_id', req.user.id).single();

    const [claimsRes, volunteersRes] = await Promise.all([
      supabase.from('ngo_food_claims').select(`*, food_listings(title, pickup_lat, pickup_lng, quantity, food_type)`)
        .eq('ngo_id', ngo?.id).eq('status', 'pending_assignment'),
      supabase.from('ngo_volunteers').select('*').eq('ngo_id', ngo?.id).eq('status', 'active').eq('availability_status', 'available'),
    ]);

    const claims = claimsRes.data || [];
    const volunteers = volunteersRes.data || [];

    // Simple distance-based matching (Haversine)
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const suggestions = claims.slice(0, 5).map((claim: any) => {
      const listing = claim.food_listings;
      const ranked = volunteers
        .map((v: any) => ({
          volunteer: v,
          distance: v.current_lat && listing?.pickup_lat
            ? haversine(v.current_lat, v.current_lng, listing.pickup_lat, listing.pickup_lng)
            : 99,
        }))
        .sort((a: any, b: any) => a.distance - b.distance);

      const best = ranked[0];
      return best ? {
        claim_id: claim.id,
        volunteer_id: best.volunteer.id,
        volunteer_name: best.volunteer.full_name,
        food_title: listing?.title || 'Food item',
        distance_km: Math.round(best.distance * 10) / 10,
        reason: `Nearest available volunteer (${Math.round(best.distance * 10) / 10} km away)`,
      } : null;
    }).filter(Boolean);

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===================== CHAT =====================
export const getTaskMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_id } = req.params;
    const { data, error } = await supabase
      .from('task_messages')
      .select('*')
      .eq('task_id', task_id)
      .order('created_at');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendTaskMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_id } = req.params;
    const { message, message_type = 'text', metadata = {} } = req.body;

    // Determine role
    const { data: ngo } = await supabase.from('ngo_organizations').select('id').eq('user_id', req.user.id).maybeSingle();
    const senderRole = ngo ? 'ngo' : 'volunteer';

    const { data, error } = await supabase.from('task_messages').insert({
      task_id,
      sender_id: req.user.id,
      sender_role: senderRole,
      message, message_type, metadata,
    }).select().single();

    if (error) throw error;

    // Broadcast to task room via Socket.io
    io.to(`task_${task_id}`).emit('new_message', data);

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
