import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      donor_type,
      address,
      pincode,
      kyc_document_url,
      selfie_url
    } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          donor_type
        }
      }
    });

    if (authError || !authData.user) {
      res.status(400).json({ success: false, error: authError?.message || 'Registration failed' });
      return;
    }

    // Insert into donors table
    const { data: profileData, error: dbError } = await supabase.from('donors').insert({
      user_id: authData.user.id,
      email,
      full_name,
      phone,
      donor_type,
      address,
      pincode,
      kyc_document_url,
      selfie_url,
      status: 'pending'
    }).select().single();

    if (dbError) {
      res.status(500).json({ success: false, error: 'Database insertion failed: ' + dbError.message });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        profile: profileData
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, token } = req.body;
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      res.status(401).json({ success: false, error: authError.message });
      return;
    }

    // Fetch profile immediately to save a client-side roundtrip
    const { data: profileData } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', authData.user?.id)
      .single();

    res.status(200).json({
      success: true,
      data: {
        ...authData,
        profile: profileData
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await supabase.auth.admin.signOut(token); // Or just have client forget token
    }

    // We can just signify successful logout
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
