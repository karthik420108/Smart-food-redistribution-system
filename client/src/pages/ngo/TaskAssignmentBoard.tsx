import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Users, Package, Clock, MapPin, CheckCircle,
  X, Loader2, Search, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNgoStore } from '../../store/ngoStore';
import { supabase } from '../../lib/supabase';
import { socket } from '../../lib/socket';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-400',
  on_task: 'bg-amber-400',
  break: 'bg-blue-400',
  offline: 'bg-gray-500',
};

const VEHICLE_ICONS: Record<string, string> = {
  bicycle: '🚲', bike: '🏍️', auto: '🛺', car: '🚗', van: '🚐', truck: '🚛', on_foot: '🚶',
};

function ExpiryCountdown({ expiryTime }: { expiryTime?: string }) {
  if (!expiryTime) return null;
  const diffMs = new Date(expiryTime).getTime() - Date.now();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  const isUrgent = diffMs < 2 * 3600000;

  if (diffMs < 0) return <span className="text-xs text-red-500 font-medium">Expired</span>;
  return (
    <span className={`text-xs font-medium ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
      {diffH > 0 ? `${diffH}h ` : ''}{diffM}m left
    </span>
  );
}

export function TaskAssignmentBoard() {
  const { claims, volunteers, tasks, fetchClaims, fetchVolunteers, fetchTasks, createTask, fetchAiSuggestions, aiSuggestions } = useNgoStore();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [instructions, setInstructions] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [volSearch, setVolSearch] = useState('');
  const [volFilter, setVolFilter] = useState('available');
  const [showAI, setShowAI] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchClaims(), fetchVolunteers(), fetchTasks()]);
      setPageLoading(false);
    };
    init();

    // Socket real-time listeners
    const setupSocket = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: ngo } = await supabase.from('ngo_organizations').select('id').eq('user_id', userData.user.id).single();
        if (ngo) {
          socket.connect();
          socket.emit('join_ngo', ngo.id);
          
          socket.on('task_status_updated', (data: any) => {
            fetchTasks();
            fetchClaims();
            // Since we can't reliably find volunteer name here without a refetch, 
            // just show status update notification
            toast(`Task updated: ${data.status.replace(/_/g, ' ')}`, { icon: '🔄' });
          });

          socket.on('task_completed', () => {
            fetchTasks();
            fetchClaims();
            fetchVolunteers();
            toast.success('Task Completed! Food Delivered.', { icon: '🎉', duration: 5000 });
          });

          socket.on('volunteer_availability_changed', () => {
            fetchVolunteers();
          });
        }
      }
    };
    setupSocket();

    // Real-time updates (Supabase)
    const channel = supabase.channel('task-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_food_claims' }, () => fetchClaims())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers' }, () => fetchVolunteers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_tasks' }, () => { fetchTasks(); fetchClaims(); })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      socket.off('task_status_updated');
      socket.off('task_completed');
      socket.off('volunteer_availability_changed');
      socket.disconnect();
    };
  }, []);

  const pendingClaims = claims.filter(c => c.status === 'pending_assignment');
  const inProgressTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));

  const filteredVolunteers = volunteers.filter(v => {
    const matchSearch = !volSearch || v.full_name.toLowerCase().includes(volSearch.toLowerCase());
    const matchFilter = volFilter === 'all' || v.availability_status === volFilter;
    return matchSearch && matchFilter && v.status === 'active';
  });

  const openAssignModal = (claim: any) => {
    setSelectedClaim(claim);
    setSelectedVolunteer(null);
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedClaim || !selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }
    setAssigning(true);
    try {
      const result = await createTask({
        claim_id: selectedClaim.id,
        volunteer_id: selectedVolunteer.id,
        special_instructions: instructions,
      });
      if (result.success) {
        toast.success(`Task assigned to ${selectedVolunteer.full_name}!`);
        setAssignModalOpen(false);
        setInstructions('');
      } else {
        toast.error(result.error || 'Assignment failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-white/5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Task Assignment Board</h1>
          <p className="text-xs text-gray-400 mt-0.5">{pendingClaims.length} pending · {inProgressTasks.length} in progress</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setShowAI(!showAI); if (!showAI) fetchAiSuggestions(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-all"
        >
          <Zap size={14} /> AI Suggestions
        </button>
      </div>

      {/* AI Suggestions Panel */}
      <AnimatePresence>
        {showAI && aiSuggestions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/5"
          >
            <div className="p-4 bg-purple-900/20">
              <div className="text-xs text-purple-400 font-semibold mb-3 uppercase tracking-wide">AI Suggestions — Click to Accept</div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((s: any, i: number) => {
                  const claim = claims.find(c => c.id === s.claim_id);
                  const vol = volunteers.find(v => v.id === s.volunteer_id);
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className="text-xs text-white">{s.food_title} → <span className="text-purple-400">{s.volunteer_name}</span></div>
                      <button
                        onClick={() => {
                          if (claim && vol) {
                            setSelectedClaim(claim);
                            setSelectedVolunteer(vol);
                            setAssignModalOpen(true);
                          }
                        }}
                        className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded hover:bg-purple-500/30"
                      >
                        Accept
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Claims Queue */}
        <div className="w-[55%] flex flex-col border-r border-white/5 overflow-hidden">
          <div className="p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-white">Needs Assignment</span>
              <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{pendingClaims.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {pendingClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                <CheckCircle size={32} className="mb-2" />
                <p className="text-sm">All claims assigned!</p>
              </div>
            ) : (
              pendingClaims.map(claim => (
                <ClaimCard key={claim.id} claim={claim} onAssign={() => openAssignModal(claim)} />
              ))
            )}

            {/* In Progress section */}
            {inProgressTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4 pb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-semibold text-white">In Progress</span>
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{inProgressTasks.length}</span>
                </div>
                {inProgressTasks.map(task => (
                  <InProgressCard key={task.id} task={task} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Volunteers */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 flex-shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-white">Volunteer Roster</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                value={volSearch}
                onChange={e => setVolSearch(e.target.value)}
                placeholder="Search volunteers..."
                className="w-full pl-8 pr-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex gap-1">
              {['available', 'on_task', 'break', 'offline', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => setVolFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    volFilter === f ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {filteredVolunteers.length === 0 ? (
              <div className="text-center py-10 text-gray-600 text-sm">No volunteers found</div>
            ) : (
              filteredVolunteers.map(vol => (
                <VolunteerCard key={vol.id} volunteer={vol} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {assignModalOpen && selectedClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setAssignModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Assign Volunteer</h3>
                  <p className="text-xs text-gray-400">{(selectedClaim.food_listings as any)?.title || 'Food Pickup'}</p>
                </div>
                <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Claim Summary */}
                <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5 text-sm space-y-2">
                  <div className="font-semibold text-white">{(selectedClaim.food_listings as any)?.title || 'Food Item'}</div>
                  <div className="flex items-center gap-4 text-gray-400 text-xs">
                    <span className="flex items-center gap-1"><Package size={12} />{selectedClaim.quantity_claimed} {selectedClaim.quantity_unit}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{(selectedClaim.food_listings as any)?.pickup_address?.substring(0, 40) || '—'}</span>
                    {(selectedClaim.food_listings as any)?.expiry_time && (
                      <ExpiryCountdown expiryTime={(selectedClaim.food_listings as any).expiry_time} />
                    )}
                  </div>
                </div>

                {/* Volunteer Selection */}
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Select Volunteer</div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {volunteers.filter(v => v.status === 'active').map(vol => (
                      <button
                        key={vol.id}
                        onClick={() => setSelectedVolunteer(vol)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selectedVolunteer?.id === vol.id
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'border-white/5 bg-gray-800/40 hover:border-white/10'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {vol.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            {vol.full_name}
                            {vol.availability_status === 'available' && (
                              <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">Available ✓</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{VEHICLE_ICONS[vol.vehicle_type || ''] || '—'} {vol.vehicle_type || 'No vehicle'}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Star size={10} />{vol.rating.toFixed(1)}</span>
                            <span>·</span>
                            <span>{vol.total_tasks_completed} tasks</span>
                          </div>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[vol.availability_status] || 'bg-gray-500'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Special Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="Handle with care, refrigeration required..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-white/5 flex gap-3">
                <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedVolunteer || assigning}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {assigning ? <Loader2 size={14} className="animate-spin" /> : null}
                  {assigning ? 'Assigning...' : selectedVolunteer ? `Assign to ${selectedVolunteer.full_name}` : 'Select a volunteer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClaimCard({ claim, onAssign }: { claim: any; onAssign: () => void }) {
  const listing = claim.food_listings;
  const isUrgent = listing?.expiry_time && (new Date(listing.expiry_time).getTime() - Date.now()) < 2 * 3600000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-2xl border bg-gray-900 transition-all hover:border-white/20 ${
        isUrgent ? 'border-red-500/30 shadow-red-900/20 shadow-lg' : 'border-white/5'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
          {listing?.images?.[0] ? (
            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍱</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{listing?.title || 'Food Item'}</div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span className="flex items-center gap-0.5"><Package size={10} />{claim.quantity_claimed} {claim.quantity_unit}</span>
            {isUrgent && <span className="text-red-400 animate-pulse font-medium">⚡ URGENT</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <MapPin size={11} />
        <span className="truncate">{listing?.pickup_address?.substring(0, 50) || '—'}</span>
      </div>
      {listing?.expiry_time && (
        <div className="flex items-center gap-1.5 mb-3">
          <Clock size={11} className="text-gray-500" />
          <ExpiryCountdown expiryTime={listing.expiry_time} />
        </div>
      )}
      <button
        onClick={onAssign}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-xl text-xs font-semibold transition-all"
      >
        Assign Volunteer
      </button>
    </motion.div>
  );
}

function InProgressCard({ task }: { task: any }) {
  const listing = task.ngo_food_claims?.food_listings;
  const statusColors: Record<string, string> = {
    'assigned': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'accepted': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'en_route_pickup': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'arrived_at_pickup': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'picked_up': 'bg-green-500/20 text-green-400 border-green-500/30',
    'en_route_delivery': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="p-3 rounded-xl border border-white/5 bg-gray-800/40 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-white truncate">{listing?.title || 'Pickup'}</div>
        <div className="text-xs text-gray-500">{task.volunteer?.full_name || 'Unassigned'}</div>
      </div>
      <div className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusColors[task.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {task.status.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

function VolunteerCard({ volunteer: vol }: { volunteer: any }) {
  return (
    <div className="p-3 rounded-xl border border-white/5 bg-gray-800/40 flex items-center gap-3 hover:border-white/10 transition-all">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-sm font-bold">
          {vol.full_name[0]}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${STATUS_COLORS[vol.availability_status] || 'bg-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{vol.full_name}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{VEHICLE_ICONS[vol.vehicle_type || ''] || '🚶'} {vol.vehicle_type || 'on foot'}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Star size={9} />{vol.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{vol.total_tasks_completed}t</span>
        </div>
      </div>
      <div className={`text-xs px-2 py-0.5 rounded-lg font-medium capitalize ${
        vol.availability_status === 'available' ? 'text-green-400 bg-green-500/10' :
        vol.availability_status === 'on_task' ? 'text-amber-400 bg-amber-500/10' :
        vol.availability_status === 'break' ? 'text-blue-400 bg-blue-500/10' :
        'text-gray-500 bg-gray-700/50'
      }`}>
        {vol.availability_status}
      </div>
    </div>
  );
}
