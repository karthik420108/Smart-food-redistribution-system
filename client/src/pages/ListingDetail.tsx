import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ArrowLeft, Heart, MessageCircle, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

      // Fetch Claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          receivers (
            full_name,
            organization_name,
            type
          )
        `)
        .eq('listing_id', id);
      
      if (claimsError) throw claimsError;
      setClaims(claimsData || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch details');
      navigate('/manage-listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      // In a real system, we'd call a backend function to verify 
      // but for this MVP, we'll check against the claim's verification_code
      const claim = claims.find(c => c.id === verifyingClaimId);
      
      if (claim.verification_code !== otp) {
        throw new Error('Invalid verification code. Please check with the receiver.');
      }

      // 1. Update claim status
      const { error: claimErr } = await supabase
        .from('claims')
        .update({ status: 'confirmed', verified_at: new Date().toISOString() })
        .eq('id', verifyingClaimId);
      
      if (claimErr) throw claimErr;

      // 2. Check if listing is fully claimed/completed
      const totalClaimed = claims.reduce((sum, c) => sum + (c.id === verifyingClaimId ? c.quantity_claimed : (c.status === 'confirmed' ? c.quantity_claimed : 0)), 0);
      
      if (totalClaimed >= listing.quantity) {
          await supabase.from('food_listings').update({ status: 'completed' }).eq('id', id);
      }

      toast.success('Pickup verified successfully!');
      setVerifyingClaimId(null);
      setOtp('');
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Decrypting Asset Details...</p>
      </div>
    );
  }

  const location = { lat: listing?.lat || 19.0760, lng: listing?.lng || 72.8777 };

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
                <div key={claim.id} className="p-6 rounded-2xl border-2 hover:border-primary/30 transition-all bg-gray-50/30 dark:bg-gray-900/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Heart className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg">{claim.receivers?.organization_name || claim.receivers?.full_name}</h4>
                        <div className="flex gap-3 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{claim.receivers?.type}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${claim.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
                                ● {claim.status}
                            </span>
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-center">
                        <p className="text-2xl font-black">{claim.quantity_claimed}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400">{listing.quantity_unit}</p>
                    </div>

                    {claim.status === 'pending' ? (
                        <button 
                            onClick={() => setVerifyingClaimId(claim.id)}
                            className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg shadow-primary/20 transition-all"
                        >
                            Verify Pickup
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase">
                            <CheckCircle2 className="w-5 h-5" /> Verified
                        </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                   <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="font-black uppercase tracking-widest text-sm">No claims recorded yet</p>
                   <p className="text-xs mt-1">Recipients will appear here once they claim your item.</p>
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
                    markers={[{ ...location, label: 'Pickup Point', type: 'donor' }]}
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
               className="bg-white dark:bg-gray-950 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border-2 border-primary/20"
             >
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black">Verify Handover</h3>
                    <p className="text-sm text-gray-500 font-medium">Please enter the 6-digit secure code provided by the receiver's app to finalize the donation.</p>
                    
                    <div className="pt-6">
                        <input 
                            type="text" 
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="0 0 0 0 0 0"
                            className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-200"
                        />
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button 
                            onClick={() => setVerifyingClaimId(null)}
                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={otp.length !== 6 || isVerifying}
                            onClick={handleVerifyOtp}
                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-xl hover:shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Pickup'}
                        </button>
                    </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
