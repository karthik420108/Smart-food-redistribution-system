import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Package, MapPin, Clock, CheckCircle, X, AlertCircle, Search, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNgoStore } from '../../store/ngoStore';

const STATUS_STYLES: Record<string, string> = {
  pending_assignment: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  volunteer_assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  volunteer_en_route: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  arrived_at_donor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  picked_up: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_transit: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function Claims() {
  const { claims, fetchClaims, cancelClaim } = useNgoStore();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims().then(() => setLoading(false));
  }, []);

  const statuses = ['all', 'pending_assignment', 'volunteer_assigned', 'picked_up', 'in_transit', 'completed', 'cancelled'];

  const filtered = claims.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = !search || (c.food_listings as any)?.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await cancelClaim(cancelModal, cancelReason);
      toast.success('Claim cancelled');
      setCancelModal(null);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-teal-400" size={28} /></div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Food Claims</h1>
          <p className="text-xs text-gray-400 mt-0.5">{claims.length} total claims</p>
        </div>
        <div className="flex-1" />
        <button onClick={() => fetchClaims()} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-3 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food title..."
            className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No claims found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(claim => {
            const listing = (claim as any).food_listings;
            const task = (claim as any).volunteer_tasks?.[0];
            const isExpanded = expandedId === claim.id;

            return (
              <motion.div key={claim.id} layout className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                >
                  {/* Food Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                    {listing?.images?.[0] ? (
                      <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍱</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{listing?.title || 'Food Item'}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Package size={10} />{claim.quantity_claimed} {claim.quantity_unit}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(claim.created_at).toLocaleDateString()}</span>
                      {task?.volunteer && <span>with {task.volunteer.full_name}</span>}
                    </div>
                  </div>

                  {/* Status + OTP */}
                  <div className="flex items-center gap-3">
                    {!claim.pickup_otp_verified && ['volunteer_assigned', 'volunteer_en_route', 'arrived_at_donor'].includes(claim.status) && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Pickup OTP</div>
                        <div className="text-lg font-mono font-bold text-teal-400">{claim.pickup_otp}</div>
                      </div>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize whitespace-nowrap ${STATUS_STYLES[claim.status] || 'bg-gray-700/50 text-gray-400 border-white/10'}`}>
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Pickup Address</div>
                            <div className="text-white">{listing?.pickup_address || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Food Type</div>
                            <div className="text-white capitalize">{listing?.food_type || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Expires</div>
                            <div className="text-white">{listing?.expiry_time ? new Date(listing.expiry_time).toLocaleString() : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">OTP Status</div>
                            <div className={claim.pickup_otp_verified ? 'text-green-400' : 'text-amber-400'}>
                              {claim.pickup_otp_verified ? '✓ Verified' : 'Pending'}
                            </div>
                          </div>
                          {claim.actual_quantity_received && (
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Actually Received</div>
                              <div className="text-white">{claim.actual_quantity_received} {claim.quantity_unit}</div>
                            </div>
                          )}
                          {(claim as any).notes && (
                            <div className="col-span-2">
                              <div className="text-xs text-gray-500 mb-0.5">Notes</div>
                              <div className="text-white">{(claim as any).notes}</div>
                            </div>
                          )}
                        </div>
                        {!['cancelled', 'completed', 'delivered'].includes(claim.status) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCancelModal(claim.id); }}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition-all"
                          >
                            Cancel Claim
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setCancelModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <h3 className="font-semibold">Cancel Claim</h3>
              </div>
              <p className="text-sm text-gray-400">Please provide a reason for cancellation.</p>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g., Already have enough food, cannot accommodate..."
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-red-500 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Dismiss</button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
