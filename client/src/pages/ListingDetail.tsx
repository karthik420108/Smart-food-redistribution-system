import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ArrowLeft, Heart, MessageCircle, ShieldCheck, AlertCircle, Loader2, CheckCircle2, User, Phone, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MockMap } from '../components/MockMap';
import toast from 'react-hot-toast';

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [volunteerLocation, setVolunteerLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchDetails = async () => {
    try {
      // Fetch Listing
      const { data: listingData, error: listingError } = await supabase
        .from('food_listings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (listingError) throw listingError;
      setListing(listingData);

      // Fetch Claims with Volunteer Tasks and NGO details
      const { data: claimsData, error: claimsError } = await supabase
        .from('ngo_food_claims')
        .select(`
          *,
          ngo:ngo_organizations (
            org_name,
            phone,
            status
          ),
          tasks:volunteer_tasks (
            id,
            status,
            volunteer:ngo_volunteers (
              id,
              full_name,
              phone,
              current_lat,
              current_lng,
              profile_photo_url
            )
          )
        `)
        .eq('listing_id', id);
      
      if (claimsError) throw claimsError;
      setClaims(claimsData || []);

      // If there's an active volunteer, set initial location
      const activeTask = claimsData?.[0]?.tasks?.[0];
      if (activeTask?.volunteer?.current_lat) {
        setVolunteerLocation({
          lat: activeTask.volunteer.current_lat,
          lng: activeTask.volunteer.current_lng
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch details');
      navigate('/manage-listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchDetails();

    // Subscribe to claim and task updates
    const channel = supabase
      .channel(`listing_tracking_${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ngo_food_claims',
        filter: `listing_id=eq.${id}`
      }, () => {
        fetchDetails();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ngo_volunteers'
      }, (payload) => {
        // Only update if this volunteer is assigned to one of our claims
        const isAssigned = claims.some(c => c.tasks?.[0]?.volunteer?.id === payload.new.id);
        if (isAssigned && payload.new.current_lat) {
          setVolunteerLocation({
            lat: payload.new.current_lat,
            lng: payload.new.current_lng
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id, claims.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Decrypting Asset Details...</p>
      </div>
    );
  }

  const location = { lat: listing?.lat || 19.0760, lng: listing?.lng || 72.8777 };
  const markers: any[] = [{ ...location, label: 'Your Location', type: 'donor' }];
  
  if (volunteerLocation) {
    markers.push({ ...volunteerLocation, label: 'Volunteer', type: 'receiver' });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <Link to="/manage-listings" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors py-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-2xl border-2 border-gray-50 dark:border-gray-900 relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm
                    ${listing.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                    `}>
                        {listing.status}
                    </span>
                    {listing.is_urgent && (
                        <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] animate-pulse">
                            URGENT
                        </span>
                    )}
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 leading-tight">{listing.title}</h1>
                <p className="flex items-center text-sm text-gray-400 font-bold mt-4 uppercase tracking-wider">
                    <Clock className="w-4 h-4 mr-2 text-primary" /> Expires {new Date(listing.expiry_datetime).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center min-w-[140px]">
                <div className="text-4xl font-black text-primary">{listing.quantity}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{listing.quantity_unit} Total</div>
              </div>
            </div>

             <div className="flex gap-3 mb-8">
                {['COOKED FOOD', listing.category.replace('_', ' ').toUpperCase()].map((tag, i) => (
                    <span key={i} className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider border border-primary/10">
                        {tag}
                    </span>
                ))}
             </div>

             <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Inventory Description</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{listing.description}</p>
             </div>
          </div>

          {/* Claims Section */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-xl border-2 border-gray-50 dark:border-gray-900">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black">Active Claims ({claims.length})</h3>
               <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> SECURE PICKUP ACTIVE
               </div>
            </div>

            <div className="space-y-4">
              {claims.length > 0 ? claims.map((claim) => (
                <div key={claim.id} className="space-y-4">
                  <div className="p-6 rounded-2xl border-2 hover:border-primary/30 transition-all bg-gray-50/30 dark:bg-gray-900/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <Heart className="w-7 h-7" />
                      </div>
                      <div>
                          <h4 className="font-black text-lg">{claim.ngo?.org_name}</h4>
                          <div className="flex gap-3 mt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">NGO Partner</span>
                              <span className={`text-[10px] font-black uppercase tracking-wider ${claim.status === 'completed' || claim.status === 'delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                                  ● {claim.status.replace(/_/g, ' ')}
                              </span>
                          </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-center">
                          <p className="text-2xl font-black">{claim.quantity_claimed}</p>
                          <p className="text-[10px] font-black uppercase text-gray-400">{listing.quantity_unit}</p>
                      </div>

                      {['pending_assignment', 'assigned', 'volunteer_en_route', 'arrived_at_donor'].includes(claim.status) ? (
                          <button 
                              onClick={() => setVerifyingClaimId(claim.id)}
                              className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                          >
                              <Shield className="w-4 h-4" /> Reveal Handover OTP
                          </button>
                      ) : (
                          <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase">
                              <CheckCircle2 className="w-5 h-5" /> {claim.status}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* New Volunteer Tracking Card */}
                  {claim.tasks?.[0] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                          {claim.tasks[0].volunteer?.profile_photo_url ? (
                            <img src={claim.tasks[0].volunteer.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-tight">Assigned Volunteer</p>
                          <h5 className="font-bold text-sm">{claim.tasks[0].volunteer?.full_name}</h5>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <a 
                          href={`tel:${claim.tasks[0].volunteer?.phone}`}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg border hover:border-primary transition-colors text-gray-600 hover:text-primary"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border text-[10px] font-black text-gray-500 uppercase">
                          {claim.tasks[0].status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )) : (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                   <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="font-black uppercase tracking-widest text-sm">No claims recorded yet</p>
                   <p className="text-xs mt-1">NGOs will appear here once they claim your item.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pickup Details Card */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-xl border-2 border-gray-50 dark:border-gray-900">
            <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-gray-400">Logistics Info</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"><Clock className="w-5 h-5 text-primary" /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Time Window</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">Available Now</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"><MapPin className="w-5 h-5 text-primary" /></div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Location</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 break-words">{listing.pickup_address}</p>
                 </div>
              </div>
            </div>
            
            <div className="mt-8">
                <MockMap 
                    className="h-56 rounded-2xl border-2" 
                    center={location}
                    markers={markers}
                />
            </div>
          </div>

          <div className="bg-primary text-white p-8 rounded-3xl shadow-2xl shadow-primary/20 relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-4 mb-4">
               <MessageCircle className="w-6 h-6" />
               <h3 className="text-xl font-bold">Live Comms</h3>
             </div>
             <p className="text-sm font-medium text-white/80 mb-6">Communicate directly with NGO coordinators for smooth handovers.</p>
             <button className="w-full py-4 bg-white text-primary font-black uppercase tracking-widest text-[10px] rounded-xl hover:shadow-xl transition-all">
               Initialize SECURE CHAT
             </button>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {verifyingClaimId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setVerifyingClaimId(null)}
             />
             <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative z-10 border-2 border-primary/20"
             >
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">Share Pickup OTP</h3>
                      <p className="text-sm text-gray-500 font-medium mt-2">Share this code with the volunteer to verify the handover.</p>
                    </div>
                    
                    <div className="py-8 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-primary/30 rounded-3xl">
                        <div className="text-5xl font-black tracking-[0.3em] text-primary">
                           {claims.find(c => c.id === verifyingClaimId)?.pickup_otp || '------'}
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                       Waiting for volunteer to enter code...
                    </p>

                    <button 
                        onClick={() => setVerifyingClaimId(null)}
                        className="w-full py-4 text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Close Terminal
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
