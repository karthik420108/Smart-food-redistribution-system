import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Phone, Star, Truck, CheckCircle,
  Loader2, X, Edit2, ChevronDown, MoreVertical, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNgoStore } from '../../store/ngoStore';

const VEHICLE_ICONS: Record<string, string> = {
  bicycle: '🚲', bike: '🏍️', auto: '🛺', car: '🚗', van: '🚐', truck: '🚛', on_foot: '🚶',
};

const STATUS_DOT: Record<string, string> = {
  available: 'bg-green-400',
  on_task: 'bg-amber-400',
  break: 'bg-blue-400',
  offline: 'bg-gray-500',
};

export function Volunteers() {
  const { volunteers, fetchVolunteers, addVolunteer, updateVolunteer, deleteVolunteer } = useNgoStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [formData, setFormData] = useState<any>({ role: 'volunteer', create_login: false });
  const [saving, setSaving] = useState(false);
  const [resultPin, setResultPin] = useState<string | null>(null);

  useEffect(() => {
    fetchVolunteers().then(() => setLoading(false));
  }, []);

  const filtered = volunteers.filter(v =>
    !search || v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.includes(search)
  );

  const handleAdd = async () => {
    setSaving(true);
    try {
      const result = await addVolunteer(formData);
      if (result.success) {
        toast.success(`${formData.full_name} added to your team!`);
        if (result.data?.setup_pin) {
          setResultPin(result.data.setup_pin);
        } else {
          setShowAddModal(false);
          resetForm();
        }
      } else {
        toast.error(result.error || 'Failed to add volunteer');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ role: 'volunteer', create_login: false });
    setAddStep(0);
    setResultPin(null);
  };

  const update = (k: string, v: any) => setFormData((p: any) => ({ ...p, [k]: v }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-teal-400" size={28} /></div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Volunteers & Staff</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {volunteers.filter(v => v.status === 'active').length} active ·{' '}
            {volunteers.filter(v => v.availability_status === 'available').length} available now
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setShowAddModal(true); setAddStep(0); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-all"
        >
          <Plus size={16} /> Add Volunteer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Available', count: volunteers.filter(v => v.availability_status === 'available').length, color: 'text-green-400' },
          { label: 'On Task', count: volunteers.filter(v => v.availability_status === 'on_task').length, color: 'text-amber-400' },
          { label: 'On Break', count: volunteers.filter(v => v.availability_status === 'break').length, color: 'text-blue-400' },
          { label: 'Offline', count: volunteers.filter(v => v.availability_status === 'offline').length, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-white/5 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-3 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500"
        />
      </div>

      {/* Volunteer Table */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Volunteer', 'Role', 'Vehicle', 'Status', 'Tasks', 'Rating', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-600">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No volunteers yet</p>
                  <button onClick={() => setShowAddModal(true)} className="mt-2 text-teal-400 text-xs hover:underline">Add your first volunteer</button>
                </td>
              </tr>
            ) : (
              filtered.map(vol => (
                <tr key={vol.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-sm font-bold">
                          {vol.full_name[0]}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${STATUS_DOT[vol.availability_status]}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{vol.full_name}</div>
                        <div className="text-xs text-gray-500">{vol.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize ${
                      vol.role === 'team_lead' ? 'bg-purple-500/20 text-purple-400' :
                      vol.role === 'driver' ? 'bg-blue-500/20 text-blue-400' :
                      vol.role === 'employee' ? 'bg-teal-500/20 text-teal-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{vol.role}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {VEHICLE_ICONS[vol.vehicle_type || ''] || '—'} {vol.vehicle_type || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[vol.availability_status]}`} />
                      <span className="text-xs text-gray-400 capitalize">{vol.availability_status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-white font-medium">{vol.total_tasks_completed}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-sm text-yellow-400">
                      <Star size={12} fill="currentColor" />
                      {vol.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const newStatus = vol.status === 'active' ? 'inactive' : 'active';
                          await updateVolunteer(vol.id, { status: newStatus });
                          toast.success(`Volunteer ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
                        }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                      >
                        {vol.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Remove ${vol.full_name} from team?`)) {
                            await deleteVolunteer(vol.id);
                            toast.success('Volunteer removed');
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Volunteer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <h3 className="text-lg font-bold text-white flex-1">
                  {resultPin ? 'Volunteer Added!' : addStep === 0 ? 'Personal Info' : addStep === 1 ? 'Role & Vehicle' : 'App Access'}
                </h3>
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${addStep >= i ? 'bg-teal-500' : 'bg-gray-700'}`} />)}
                </div>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-white ml-2"><X size={18} /></button>
              </div>

              {resultPin ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{formData.full_name} has been added!</div>
                    <div className="text-gray-400 text-sm mt-1">Share this setup PIN with them to activate their account:</div>
                  </div>
                  <div className="text-4xl font-mono font-bold tracking-[0.3em] text-teal-400 bg-teal-500/10 rounded-2xl py-4 border border-teal-500/20">
                    {resultPin}
                  </div>
                  <p className="text-xs text-gray-500">The volunteer uses this PIN + their phone number to set a password on the Volunteer portal.</p>
                  <button
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-5 space-y-4">
                    {addStep === 0 && (
                      <>
                        {[
                          { label: 'Full Name *', key: 'full_name', placeholder: 'Enter full name' },
                          { label: 'Phone *', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                          { label: 'WhatsApp', key: 'whatsapp', placeholder: 'WhatsApp number' },
                          { label: 'Email', key: 'email', placeholder: 'volunteer@email.com', type: 'email' },
                          { label: 'Emergency Contact', key: 'emergency_contact_name', placeholder: 'Name' },
                          { label: 'Emergency Phone', key: 'emergency_contact_phone', placeholder: 'Phone' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">{f.label}</label>
                            <input
                              type={f.type || 'text'}
                              placeholder={f.placeholder}
                              value={formData[f.key] || ''}
                              onChange={e => update(f.key, e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500"
                            />
                          </div>
                        ))}
                      </>
                    )}
                    {addStep === 1 && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-400 block mb-2">Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['volunteer', 'employee', 'team_lead', 'driver'].map(r => (
                              <button key={r} type="button" onClick={() => update('role', r)}
                                className={`py-2 rounded-xl text-xs font-medium capitalize border transition-all ${formData.role === r ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-white/10 bg-gray-800/50 text-gray-400'}`}>
                                {r.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-400 block mb-2">Vehicle Type</label>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(VEHICLE_ICONS).map(([v, icon]) => (
                              <button key={v} type="button" onClick={() => update('vehicle_type', v)}
                                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs border transition-all ${formData.vehicle_type === v ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-white/10 bg-gray-800/50 text-gray-400'}`}>
                                <span className="text-lg">{icon}</span>
                                <span className="capitalize">{v.replace('_', ' ')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-400 block mb-1.5">Vehicle Number</label>
                          <input type="text" placeholder="KA 01 AB 1234" value={formData.vehicle_number || ''}
                            onChange={e => update('vehicle_number', e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500" />
                        </div>
                      </>
                    )}
                    {addStep === 2 && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-white/5">
                          <div>
                            <div className="text-sm font-medium text-white">Create App Login</div>
                            <div className="text-xs text-gray-500">Volunteer can sign in to the Volunteer Portal</div>
                          </div>
                          <button
                            onClick={() => update('create_login', !formData.create_login)}
                            className={`w-11 h-6 rounded-full transition-all relative ${formData.create_login ? 'bg-teal-500' : 'bg-gray-700'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.create_login ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        {formData.create_login && (
                          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400">
                            A 6-digit Setup PIN will be generated. Share it with {formData.full_name || 'the volunteer'} so they can create their password on the Volunteer Portal.
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-medium text-gray-400 block mb-1.5">Internal Notes</label>
                          <textarea rows={2} value={formData.notes || ''} onChange={e => update('notes', e.target.value)}
                            placeholder="Notes visible to NGO admin only..."
                            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500 resize-none" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 p-5 border-t border-white/5">
                    {addStep > 0 && <button onClick={() => setAddStep(s => s - 1)} className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Back</button>}
                    {addStep < 2 ? (
                      <button onClick={() => setAddStep(s => s + 1)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                    ) : (
                      <button onClick={handleAdd} disabled={saving || !formData.full_name || !formData.phone}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                        {saving ? 'Adding...' : 'Add Volunteer'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
