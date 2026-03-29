import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, Package, MapPin, Clock, CheckCircle, Star, TrendingUp,
  ClipboardList, AlertCircle, ArrowRight, Navigation, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useVolunteerStore } from '../../store/volunteerStore';

const STATUS_STEPS = [
  { key: 'assigned', label: 'Task Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'en_route_pickup', label: 'En Route to Pickup' },
  { key: 'arrived_at_pickup', label: 'Arrived at Donor' },
  { key: 'otp_verified', label: 'OTP Verified' },
  { key: 'picked_up', label: 'Food Picked Up' },
  { key: 'en_route_delivery', label: 'En Route to NGO' },
  { key: 'delivered', label: 'Food Delivered' },
];

const NEXT_STATUS: Record<string, string> = {
  'assigned': 'accepted',
  'accepted': 'en_route_pickup',
  'en_route_pickup': 'arrived_at_pickup',
  'otp_verified': 'picked_up',
  'picked_up': 'en_route_delivery',
  'en_route_delivery': 'delivered',
};

const NEXT_LABEL: Record<string, string> = {
  'assigned': 'Accept Task',
  'accepted': 'Start Journey to Pickup',
  'en_route_pickup': "I've Arrived at Pickup",
  'otp_verified': 'Mark as Picked Up',
  'picked_up': 'Start Delivery',
  'en_route_delivery': 'Mark as Delivered',
};

export function VolunteerHome() {
  const { volunteer, activeTask, fetchProfile, fetchActiveTask, updateAvailability, updateTaskStatus } = useVolunteerStore();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const locationWatchId = useRef<number | null>(null);
  const { pingLocation } = useVolunteerStore();

  useEffect(() => {
    fetchProfile();
    fetchActiveTask();
  }, []);

  // Start GPS pinging when on task
  useEffect(() => {
    if (activeTask && activeTask.status !== 'completed') {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          pingLocation({
            task_id: activeTask.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed_kmph: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
            heading: pos.coords.heading || undefined,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    } else {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    }
    return () => {
      if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [activeTask?.id, activeTask?.status]);

  const handleStatusUpdate = async () => {
    if (!activeTask) return;
    const next = NEXT_STATUS[activeTask.status];
    if (!next) return;
    setUpdating(true);
    try {
      await updateTaskStatus(activeTask.id, next);
      toast.success('Status updated!');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const listing = activeTask?.ngo_food_claims?.food_listings;
  const donor = listing?.donors;
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === activeTask?.status);

  const needsOtp = activeTask?.status === 'arrived_at_pickup';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-white">Hi, {volunteer?.full_name?.split(' ')[0] || 'there'} 👋</div>
          <div className="text-sm text-gray-400">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <button
          onClick={() => {
            const newStatus = volunteer?.availability_status === 'available' ? 'offline' : 'available';
            updateAvailability(newStatus as any);
            toast.success(`You're now ${newStatus}`);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            volunteer?.availability_status === 'available'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-gray-700/50 text-gray-400 border-white/10'
          }`}
        >
          {volunteer?.availability_status === 'available' ? '● Online' : '○ Offline'}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-2xl p-3.5 border border-white/5 text-center">
          <div className="text-xl font-bold text-orange-400">{volunteer?.total_tasks_completed || 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Completed</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-3.5 border border-white/5 text-center">
          <div className="text-xl font-bold text-teal-400">{volunteer?.total_kg_collected?.toFixed(0) || '0'} kg</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Collected</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-3.5 border border-white/5 text-center">
          <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
            <Star size={14} fill="currentColor" />{volunteer?.rating?.toFixed(1) || '—'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Rating</div>
        </div>
      </div>

      {/* Active Task Card */}
      {activeTask ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl border border-orange-500/20 overflow-hidden shadow-orange-900/20 shadow-xl"
        >
          {/* Status Progress */}
          <div className="bg-orange-500/10 p-4 border-b border-orange-500/10">
            <div className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-3">Active Pickup</div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STATUS_STEPS.slice(0, 7).map((step, i) => (
                <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    i < currentStepIdx ? 'bg-green-400' :
                    i === currentStepIdx ? 'bg-orange-400 animate-pulse' :
                    'bg-gray-700'
                  }`} />
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-6 h-px ${i < currentStepIdx ? 'bg-green-400' : 'bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-white font-medium mt-2">
              {STATUS_STEPS[currentStepIdx]?.label || activeTask.status}
            </div>
          </div>

          {/* Food Info */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                {listing?.images?.[0] ? (
                  <img src={listing.images[0]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍱</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{listing?.title || 'Food Pickup'}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Package size={10} />
                  {activeTask.ngo_food_claims?.quantity_claimed} {activeTask.ngo_food_claims?.quantity_unit}
                </div>
                {listing?.expiry_time && (
                  <div className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    Expires {new Date(listing.expiry_time).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-800/50">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={10} className="text-teal-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pickup from</div>
                  <div className="text-sm text-white">{listing?.pickup_address || activeTask.pickup_address}</div>
                  {donor && <div className="text-xs text-gray-500">{donor.full_name} · {donor.phone}</div>}
                </div>
                <a href={`https://maps.google.com/?q=${activeTask.pickup_lat},${activeTask.pickup_lng}`} target="_blank" rel="noopener noreferrer"
                  className="ml-auto p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20">
                  <Navigation size={12} />
                </a>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-800/50">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={10} className="text-orange-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Deliver to</div>
                  <div className="text-sm text-white">{activeTask.ngo_organizations?.org_name}</div>
                  <div className="text-xs text-gray-500">{activeTask.delivery_address || activeTask.ngo_organizations?.primary_address}</div>
                </div>
                <a href={`https://maps.google.com/?q=${activeTask.delivery_lat},${activeTask.delivery_lng}`} target="_blank" rel="noopener noreferrer"
                  className="ml-auto p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                  <Navigation size={12} />
                </a>
              </div>
            </div>

            {/* OTP Notice */}
            {needsOtp && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">Ask the donor for their OTP to verify pickup</p>
                <button onClick={() => navigate(`/volunteer/tasks/${activeTask.id}/otp`)} className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30">
                  Enter OTP →
                </button>
              </div>
            )}

            {/* Action */}
            {NEXT_STATUS[activeTask.status] && activeTask.status !== 'arrived_at_pickup' && (
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                {NEXT_LABEL[activeTask.status]}
              </button>
            )}

            {activeTask.status === 'en_route_delivery' && (
              <button
                onClick={() => navigate(`/volunteer/tasks/${activeTask.id}/complete`)}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Complete Delivery
              </button>
            )}

            <button
              onClick={() => navigate(`/volunteer/tasks/${activeTask.id}`)}
              className="w-full text-sm text-gray-400 hover:text-white py-2 flex items-center justify-center gap-2"
            >
              View Full Details <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-orange-400" />
          </div>
          <div className="text-white font-semibold mb-1">No Active Task</div>
          <p className="text-sm text-gray-400">You'll be notified when the NGO assigns you a pickup.</p>
          {volunteer?.availability_status !== 'available' && (
            <button
              onClick={() => updateAvailability('available')}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-600/20 text-orange-400 text-sm border border-orange-500/20 hover:bg-orange-600/30"
            >
              Go Online →
            </button>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/volunteer/tasks')} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-900 border border-white/5 hover:border-white/10 transition-all">
          <ClipboardList size={18} className="text-blue-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-white">Task History</div>
            <div className="text-xs text-gray-500">View all tasks</div>
          </div>
        </button>
        <button onClick={() => navigate('/volunteer/profile')} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-900 border border-white/5 hover:border-white/10 transition-all">
          <TrendingUp size={18} className="text-purple-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-white">My Profile</div>
            <div className="text-xs text-gray-500">Stats & settings</div>
          </div>
        </button>
      </div>
    </div>
  );
}



