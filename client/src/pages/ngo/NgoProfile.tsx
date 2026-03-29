import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, Building2, Phone, MapPin, Globe, Loader2, CheckCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNgoStore } from '../../store/ngoStore';
import api from '../../lib/api';

export function NgoProfilePage() {
  const { ngo, fetchNgo } = useNgoStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetchNgo().then(() => {
      if (ngo) setForm({ ...ngo });
    });
  }, []);

  useEffect(() => {
    if (ngo) setForm({ ...ngo });
  }, [ngo]);

  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/ngo/me', {
        bio: form.bio,
        website: form.website,
        whatsapp: form.whatsapp,
        beneficiary_count: form.beneficiary_count,
        service_radius_km: form.service_radius_km,
      });
      await fetchNgo();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!ngo) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-teal-400" size={28} /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">NGO Profile</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold disabled:opacity-60 transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {/* Identity */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-teal-700/30 flex items-center justify-center text-white text-2xl font-bold">
            {ngo.org_name[0]}
          </div>
          <div>
            <div className="text-white font-semibold">{ngo.org_name}</div>
            <div className={`text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block ${
              ngo.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
            }`}>{ngo.status}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Trust Score</div>
            <div className="text-xl font-bold text-teal-400">{ngo.trust_score}/100</div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">About / Bio</label>
          <textarea rows={3} value={form.bio || ''} onChange={e => update('bio', e.target.value)}
            placeholder="Describe your NGO, mission, and beneficiaries..."
            className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-teal-500 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Website</label>
            <input type="url" value={form.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">WhatsApp</label>
            <input type="tel" value={form.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Beneficiaries Served Daily</label>
            <input type="number" value={form.beneficiary_count || ''} onChange={e => update('beneficiary_count', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Service Radius: {form.service_radius_km} km</label>
            <input type="range" min={2} max={50} value={form.service_radius_km || 10} onChange={e => update('service_radius_km', parseInt(e.target.value))} className="w-full accent-teal-500 mt-2" />
          </div>
        </div>
      </div>

      {/* Read-only Info */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 space-y-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Account Info (read-only)</div>
        {[
          { label: 'Org Type', value: ngo.org_type },
          { label: 'Reg. Number', value: ngo.registration_number },
          { label: 'Primary Address', value: ngo.primary_address },
          { label: 'Email', value: ngo.email },
          { label: 'Phone', value: ngo.phone },
          { label: 'Member Since', value: new Date(ngo.created_at).toLocaleDateString() },
        ].map(f => (
          <div key={f.label} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-gray-500 w-28 flex-shrink-0">{f.label}</span>
            <span className="text-sm text-white capitalize">{f.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
