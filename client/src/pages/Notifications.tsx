import { useState, useEffect } from 'react';
import { Bell, Heart, MapPin, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  const markAllAsRead = async () => {
    try {
       const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);
       
       if (error) throw error;
       fetchNotifications();
       toast.success('All marked as read');
    } catch (err: any) {
       toast.error('Failed to update');
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
        case 'new_listing': return <MapPin className="w-5 h-5" />;
        case 'claim_update': return <Heart className="w-5 h-5" />;
        case 'verification_needed': return <CheckCircle2 className="w-5 h-5" />;
        default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Signal Hub</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Real-time Network Activity Monitoring</p>
        </div>
        <button 
           onClick={markAllAsRead}
           className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-2"
        >
           <CheckCircle2 className="w-4 h-4" /> Clear All Signals
        </button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-3xl border-2 shadow-2xl overflow-hidden divide-y-2">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 text-primary animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Network Signals...</span>
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((notification, i) => (
              <motion.div 
                key={notification.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-6 flex gap-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all relative group ${
                    !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                  {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 ${
                      !notification.read ? 'bg-primary text-white border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}>
                      {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start mb-1">
                        <p className={`font-black text-lg ${!notification.read ? 'text-gray-900' : 'text-gray-500'}`}>
                            {notification.message}
                        </p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                            {new Date(notification.created_at).toLocaleTimeString()}
                        </span>
                     </div>
                     <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                        {notification.metadata?.listing_title ? `Relating to listing: ${notification.metadata.listing_title}` : 'Network update regarding your active redistributions.'}
                     </p>
                     
                     <div className="flex items-center gap-4">
                         {notification.metadata?.listing_id && (
                             <Link 
                                to={`/listings/${notification.metadata.listing_id}`}
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                             >
                                 Investigate Asset <ArrowRight className="w-3 h-3" />
                             </Link>
                         )}
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                             REF: {notification.id.split('-')[0]}
                         </span>
                     </div>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-32 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-gray-200">
                <Bell className="w-8 h-8 text-gray-200" />
             </div>
             <div className="space-y-1">
                <h3 className="font-black uppercase tracking-widest text-gray-400">Zero Signals Detected</h3>
                <p className="text-xs text-gray-500 font-medium">Your network is currently silent. New activity will appear here.</p>
             </div>
          </div>
        )}
      </div>

      {/* Network Status Footer */}
      <div className="flex justify-center items-center gap-8 py-4 px-8 bg-gray-50 dark:bg-gray-950 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Node Connected</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Live Sync Active</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Encrypted Transmission</span>
          </div>
      </div>
    </div>
  );
}
