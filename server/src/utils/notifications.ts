import { supabase } from '../lib/supabase';
import { getIO } from '../index';

export type NotificationType = 'new_listing' | 'claim_update' | 'task_assigned' | 'task_status_changed' | 'otp_verified' | 'verification_needed' | 'system_alert' | 'points_awarded';

/**
 * Creates a persistent notification in the database and emits it via socket.io for real-time delivery.
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  message: string;
  metadata?: any;
}) {
  const { userId, type, message, metadata } = params;

  try {
    // 1. Insert into persistent database table
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        metadata: metadata || {},
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating database notification:', error);
      // We still try to emit via socket even if DB fails, so UI updates
    }

    // 2. Emit real-time signal via Socket.io
    const io = getIO();
    const roomPrefix = metadata?.role || 'user'; // donor, ngo, or volunteer
    
    // Emit specifically to the user's room
    io.to(`${roomPrefix}_${userId}`).emit('notification', notification || { type, message, metadata });
    
    // Also emit specific events if needed (compatibility with existing listeners)
    if (type === 'task_assigned') io.to(`volunteer_${userId}`).emit('task_assigned', metadata?.task);
    if (type === 'otp_verified') io.to(`donor_${userId}`).emit('listing_updated', metadata);

    return { success: true, notification };
  } catch (err) {
    console.error('Notification System Error:', err);
    return { success: false, error: err };
  }
}
