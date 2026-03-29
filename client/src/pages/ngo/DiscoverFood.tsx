import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, MapPin, Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNgoStore } from '../../store/ngoStore';
import api from '../../lib/api';

const FOOD_TYPES = ['all', 'cooked', 'raw', 'packaged', 'baked', 'beverages', 'dairy'];

export function DiscoverFood() {
  const navigate = useNavigate();
  const { createClaim } = useNgoStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimModal, setClaimModal] = useState<any>(null);
  const [qtyToClaim, setQtyToClaim] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/listings/available');
        setListings(res.data.data || []);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = listings.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.pickup_address?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.category === typeFilter;
    return matchSearch && matchType;
  });

  const handleClaim = async () => {
    if (!claimModal || !qtyToClaim) return;
    setClaimingId(claimModal.id);
    try {
      const result = await createClaim({ listing_id: claimModal.id, quantity_claimed: parseFloat(qtyToClaim), quantity_unit: claimModal.quantity_unit || 'kg' });
      if (result.success) {
        toast.success('Claim submitted! Redirecting to assign a volunteer...');
        setTimeout(() => {
          navigate('/ngo/tasks');
        }, 1500);
        setClaimModal(null);
      } else {
        toast.error(result.error || 'Claim failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClaimingId(null);
    }
  };

  const ExpiryBadge = ({ time }: { time: string }) => {
    const diffH = Math.floor((new Date(time).getTime() - Date.now()) / 3600000);
    if (diffH < 0) return <span className="text-xs text-red-500">Expired</span>;
    return (
      <span className={`text-xs font-medium ${diffH < 2 ? 'text-red-400' : diffH < 6 ? 'text-amber-400' : 'text-gray-400'}`}>
        {diffH < 1 ? '<1h left' : `${diffH}h left`}
      </span>
    );
  };

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Discover Available Food</h1>
        <p className="text-xs text-gray-400 mt-0.5">Browse and claim surplus food listings near your NGO</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-3 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food or location..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500" />
        </div>
        <div className="flex gap-1.5">
          {FOOD_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                typeFilter === t ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}>{t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-teal-400" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No food listings available right now</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group"
            >
              {/* Image */}
              <div className="h-36 bg-gray-800 relative overflow-hidden">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍱</div>
                )}
                {listing.expiry_datetime && (
                  <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur px-2 py-0.5 rounded-lg">
                    <ExpiryBadge time={listing.expiry_datetime} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur px-2 py-0.5 rounded-lg">
                  <span className="text-xs text-white capitalize">{listing.category || 'food'}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="text-sm font-semibold text-white mb-1 line-clamp-1">{listing.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Package size={10} />{listing.quantity} {listing.quantity_unit}</span>
                  <span className="flex items-center gap-1 truncate"><MapPin size={10} />{listing.pickup_address?.substring(0, 25) || '—'}</span>
                </div>
                {listing.dietary_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {listing.dietary_tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded-md">{tag}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setClaimModal(listing); setQtyToClaim(String(listing.quantity)); }}
                  disabled={claimingId === listing.id}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {claimingId === listing.id ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} />}
                  Claim This Food
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setClaimModal(null)}>
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-sm p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-white">Claim Food</h3>
            <div className="p-3 rounded-xl bg-gray-800/60 text-sm text-gray-300">{claimModal.title}</div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Quantity to Claim</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.5" value={qtyToClaim} onChange={e => setQtyToClaim(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500" />
                <span className="text-gray-400 text-sm">{claimModal.quantity_unit}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Max available: {claimModal.quantity_available} {claimModal.quantity_unit}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setClaimModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
              <button onClick={handleClaim} disabled={!qtyToClaim || !!claimingId}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                {claimingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm Claim
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
