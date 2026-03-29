import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Package, Truck, User, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVolunteerStore } from '../../store/volunteerStore';
import api from '../../lib/api';

const VEHICLE_ICONS: Record<string, string> = {
  bicycle: '🚲', bike: '🏍️', auto: '🛺', car: '🚗', van: '🚐', truck: '🚛', on_foot: '🚶',
};

export function VolunteerProfile() {
  const { volunteer, fetchProfile, updateAvailability } = useVolunteerStore();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (volunteer) {
      setForm({
        profile_photo_url: volunteer.profile_photo_url || '',
        vehicle_type: volunteer.vehicle_type || '',
      });
    }
  }, [volunteer]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/volunteer/me', form);
      await fetchProfile();
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !volunteer) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-orange-400" size={28} /></div>;
  }

  const mealsProvided = Math.round((volunteer.total_kg_collected || 0) * 2.5);
  const co2Saved = ((volunteer.total_kg_collected || 0) * 2.5).toFixed(1);

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl border border-white/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/40 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {volunteer.full_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-white">{volunteer.full_name}</div>
            <div className="text-sm text-orange-400 capitalize">{volunteer.role}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <Phone size={11} /> {volunteer.phone}
              {volunteer.vehicle_type && (
                <><span>·</span><span>{VEHICLE_ICONS[volunteer.vehicle_type]} {volunteer.vehicle_type}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-semibold">{volunteer.rating?.toFixed(1)}</span>
          </div>
        </div>

        {volunteer.ngo_organizations && (
          <div className="mt-4 p-3 rounded-xl bg-gray-800/50 border border-white/5 text-xs">
            <div className="text-gray-500 mb-0.5">Working for</div>
            <div className="text-white font-medium">{volunteer.ngo_organizations.org_name}</div>
            <div className="text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />{volunteer.ngo_organizations.primary_address}
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-xl font-bold text-orange-400">{volunteer.total_tasks_completed}</div>
          <div className="text-xs text-gray-500 mt-0.5">Tasks Done</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-xl font-bold text-teal-400">{volunteer.total_kg_collected?.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500 mt-0.5">Collected</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-xl font-bold text-green-400">{mealsProvided}</div>
          <div className="text-xs text-gray-500 mt-0.5">Meals Given</div>
        </div>
      </div>

      {/* Impact line */}
      <div className="bg-gradient-to-r from-teal-900/40 to-green-900/40 rounded-2xl p-4 border border-teal-500/20 text-center">
        <p className="text-sm text-teal-300">
          You've offset <strong>{co2Saved} kg</strong> of CO₂ through food rescue! 🌍
        </p>
      </div>

      {/* Availability Toggle */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">Availability Status</div>
          <div className="text-xs text-gray-400 capitalize mt-0.5">{volunteer.availability_status}</div>
        </div>
        <div className="flex gap-2">
          {['available', 'break', 'offline'].map(s => (
            <button
              key={s}
              onClick={() => { updateAvailability(s as any); toast.success(`Status: ${s}`); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                volunteer.availability_status === s
                  ? s === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : s === 'break' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-700 text-gray-300 border border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
