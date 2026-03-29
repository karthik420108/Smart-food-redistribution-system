import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, TrendingUp, Clock, Plus, Trophy, 
  Archive, Award, Zap, ArrowRight, Shield, Target, User, 
  MessageSquare, Package, Leaf, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useLeafletFix } from '../hooks/useLeafletFix';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { socket } from '../lib/socket';


export function DashboardOverview() {
  useLeafletFix();
  const navigate = useNavigate();
  const { user, donorProfile } = useAuthStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const markerMap = useRef<Map<string, any>>(new Map());
  
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [activeVolunteers, setActiveVolunteers] = useState<Record<string, any>>({});
  const [activePickups, setActivePickups] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [overview, detailed] = await Promise.all([
        apiFetch('/analytics/overview'),
        apiFetch('/analytics/detailed')
      ]);
      setStats({ ...overview, detailed: detailed.totals });

      const { data: claims } = await supabase
        .from('ngo_food_claims')
        .select(`
          *,
          food_listings(title, donor_id, pickup_address, quantity, quantity_unit),
          ngo_organizations(org_name, logo_url),
          tasks:volunteer_tasks (
            id, status, 
            volunteer:ngo_volunteers (
              id, full_name, current_lat, current_lng, profile_photo_url, phone
            )
          )
        `)
        .eq('food_listings.donor_id', donorProfile?.id)
        .order('created_at', { ascending: false });

      const { data: newListings } = await supabase
        .from('food_listings')
        .select('*')
        .eq('donor_id', donorProfile?.id)
        .limit(10)
        .order('created_at', { ascending: false });

      // Identify active pickups
      const active = claims?.filter(c => ['assigned', 'volunteer_en_route', 'arrived_at_donor'].includes(c.status)) || [];
      setActivePickups(active);

      // Map volunteer locations
      const volunteerMap: Record<string, any> = {};
      active.forEach(c => {
        const v = c.tasks?.[0]?.volunteer;
        if (v?.id) volunteerMap[v.id] = v;
      });
      setActiveVolunteers(volunteerMap);

      const combinedActivities = [
        ...(claims || []).map(c => ({ ...c, activity_type: 'claim' })),
        ...(newListings || []).map(l => ({ ...l, activity_type: 'listing' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setActivities(combinedActivities);
    } catch (err) {
      console.error('Data Sync Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();

    // Sockets for real-time alerts
    if (user) {
       socket.connect();
       socket.emit('join_donor', donorProfile?.id);
       
       socket.on('task_status_changed', (data: any) => {
         toast.success(`Logistics Update: ${data.status.replace(/_/g, ' ')}`, { icon: '🚚' });
         fetchData();
       });

       socket.on('volunteer_location_update', (data: any) => {
         setActiveVolunteers(prev => {
            if (prev[data.volunteer_id]) {
                return {
                    ...prev,
                    [data.volunteer_id]: { ...prev[data.volunteer_id], current_lat: data.lat, current_lng: data.lng }
                };
            }
            return prev;
         });
       });
    }

    // Supabase fallback
    const channel = supabase.channel(`donor-${donorProfile?.id}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_food_claims' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_tasks' }, (payload: any) => {
        if (payload.new.status === 'completed' || payload.new.status === 'delivered') {
          setVerifyingClaimId(null);
          toast.success('Inventory Handover Confirmed!', { icon: '🏆' });
        }
        fetchData();
      })
      .subscribe();

    return () => { 
      channel.unsubscribe(); 
      socket.off('task_status_changed');
      socket.off('volunteer_location_update');
    };
  }, [user, donorProfile?.id]);

  // Leaflet initialization
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initialCenter: any = donorProfile?.lat && donorProfile?.lng 
      ? [donorProfile.lat, donorProfile.lng] 
      : [19.0760, 72.8777];

    const map = (L as any).map(mapRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    (L as any).tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    mapInstance.current = map;
    markersRef.current = (L as any).layerGroup().addTo(map);

    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [donorProfile]);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    // Donor Home
    if (donorProfile?.lat && donorProfile?.lng) {
      (L as any).marker([donorProfile.lat, donorProfile.lng], {
        icon: (L as any).divIcon({
          className: 'custom-icon',
          html: `<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>`,
          iconSize: [20, 20]
        })
      }).bindPopup('<b class="text-xs">Your Hub</b>').addTo(markersRef.current);
    }

    // Active Volunteers
    Object.values(activeVolunteers).forEach((v: any) => {
      let marker = markerMap.current.get(v.id);
      const pos: any = [v.current_lat, v.current_lng];

      if (marker) {
        marker.setLatLng(pos);
      } else {
        marker = (L as any).marker(pos, {
          icon: (L as any).divIcon({
            className: 'volunteer-marker',
            html: `
              <div class="relative group">
                <div class="absolute -top-10 -left-6 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl uppercase tracking-tighter scale-0 group-hover:scale-100 transition-transform">
                  ${v.full_name.split(' ')[0]}
                </div>
                <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <div class="absolute inset-x-0 bottom-0 top-0 bg-blue-400 rounded-full animate-ping opacity-25"></div>
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
            `,
            iconSize: [24, 24]
          })
        }).addTo(mapInstance.current);
        markerMap.current.set(v.id, marker);
      }
    });

    // Fit bounds if needed
    if (Object.keys(activeVolunteers).length > 0 && donorProfile?.lat) {
       const bounds = (L as any).latLngBounds([[donorProfile.lat, donorProfile.lng]]);
       Object.values(activeVolunteers).forEach((v: any) => bounds.extend([v.current_lat, v.current_lng]));
       mapInstance.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [activeVolunteers, donorProfile]);

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-6">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
           <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Establishing Command Link...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 space-y-8 max-w-7xl mx-auto pb-20"
    >
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 py-4 border-b border-white/5">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
             Command Center
             <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">DONOR_{donorProfile?.id?.slice(0,5)}</span>
           </h1>
           <p className="text-gray-500 text-sm mt-1 font-medium italic">Operational status: <span className="text-emerald-500">OPTIMAL</span> · Active in {(donorProfile as any)?.city || donorProfile?.address?.split(',').pop()?.trim() || 'Region'}</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 p-1 px-4 rounded-2xl flex items-center gap-6 shadow-2xl">
              <div className="flex flex-col items-center py-2">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Rank</p>
                 <Trophy className="text-amber-500 mb-1" size={16} />
                 <p className="text-xs font-black text-white">{stats?.detailed?.rank || 'Rookie'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-end py-2">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact Credits</p>
                 <div className="flex items-center gap-2">
                    <Award className="text-emerald-500" size={16} />
                    <p className="text-xl font-black text-white leading-none">{stats?.points?.toLocaleString() || 0}</p>
                 </div>
              </div>
           </div>
           <button onClick={() => navigate('/create-listing')} className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={20} strokeWidth={3} />
              <span className="text-xs font-black uppercase tracking-widest md:block hidden">Publish Asset</span>
           </button>
        </div>
      </div>

      {/* Real Infrastructure Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Food Mass Saved", value: `${stats?.detailed?.completed_kg || 0}kg`, sub: "Real-world Volume", icon: Package, color: "text-emerald-400", bg: "emerald" },
          { label: "Community Feeding", value: stats?.detailed?.meals_equivalent || 0, sub: "Meals Generated", icon: Heart, color: "text-red-400", bg: "red" },
          { label: "Sustainability Factor", value: `${stats?.detailed?.co2_saved || 0}kg`, sub: "CO₂ Prevention", icon: Leaf, color: "text-blue-400", bg: "blue" },
          { label: "Network Reach", value: stats?.ngosHelped || 0, sub: "NGO Partners", icon: MapPin, color: "text-purple-400", bg: "purple" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-gray-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all"
          >
             <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.bg}-500/10 flex items-center justify-center ${stat.color} shadow-inner`}>
                   <stat.icon size={24} />
                </div>
                {i === 0 && <Zap size={14} className="text-emerald-500 animate-pulse" />}
             </div>
             <p className="text-2xl font-black text-white tracking-widest">{stat.value}</p>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
             <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{stat.sub}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Logistics Map & Active Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Logistics Map */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-[450px] relative">
             <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Target size={18} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Fleet Monitor</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Real-time GPS Tracking Integration</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[9px] font-black text-gray-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      SECURE CONNECTION
                   </div>
                </div>
             </div>
             
             <div ref={mapRef} className="w-full h-full grayscale-[0.8] hover:grayscale-0 transition-all duration-700" />
             
             {/* Map Overlay for Active Missions */}
             <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                   {activePickups.map((pick, idx) => (
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={pick.id} 
                        className="min-w-[280px] bg-white text-black p-4 rounded-2xl shadow-2xl flex items-center gap-4 relative overflow-hidden"
                      >
                         <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Truck size={24} className="text-emerald-600" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">Active Deployment {idx+1}</p>
                            <h4 className="font-bold text-sm truncate">{pick.ngo_organizations?.org_name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                               <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                  <Clock size={10} />
                                  ETA: 12 MIN
                               </div>
                               <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                  <MapPin size={10} />
                                  {pick.tasks?.[0]?.volunteer?.full_name?.split(' ')[0]}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </div>

          {/* Activity Feed Upgrade */}
          <div className="bg-gray-900/50 rounded-[2.5rem] border border-white/5 p-8">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  Logistics Ledger
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Real-time Event Stream</span>
                </h3>
                <button className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors">Historical Data <ArrowRight size={10} className="inline ml-1" /></button>
             </div>
             
             <div className="space-y-4">
                {activities.map((act, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={act.id} 
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                  >
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                       act.activity_type === 'claim' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                     }`}>
                        {act.activity_type === 'claim' ? <Zap size={18} /> : <TrendingUp size={18} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <p className="text-xs font-black text-gray-200 uppercase tracking-tight">
                              {act.activity_type === 'claim' ? 'Asset Optimization' : 'Nexus Publication'}
                           </p>
                           <span className="text-[10px] font-mono text-gray-600">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1 group-hover:text-white transition-colors">
                           {act.activity_type === 'claim' ? 
                             `${act.ngo_organizations?.org_name} initiated ${act.quantity_claimed}kg pickup request` : 
                             `Global node received ${act.quantity}${act.quantity_unit} of ${act.title}`
                           }
                        </p>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Operational Status & OTP Verification */}
        <div className="space-y-8">
           {/* Active Pickups Panel */}
           <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                 <Shield size={100} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xl font-black tracking-tight mb-2">Live Pickups</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-8">Secure Verification Protocol Active</p>
                 
                 <div className="space-y-4">
                    {activePickups.length > 0 ? activePickups.map(p => (
                       <div key={p.id} className="p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all">
                          <div className="flex justify-between items-center mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
                                   {p.tasks?.[0]?.volunteer?.profile_photo_url ? 
                                     <img src={p.tasks[0].volunteer.profile_photo_url} className="w-full h-full object-cover" /> : 
                                     <User size={14} />
                                   }
                                </div>
                                <div>
                                   <p className="text-[11px] font-black uppercase tracking-tight leading-none">{p.tasks?.[0]?.volunteer?.full_name}</p>
                                   <p className="text-[9px] font-bold opacity-60 uppercase mt-1">VOLUNTEER EN ROUTE</p>
                                </div>
                             </div>
                             <div className="bg-white/10 p-1.5 rounded-lg">
                                <MessageSquare size={14} />
                             </div>
                          </div>
                          <button 
                            onClick={() => setVerifyingClaimId(p.id)}
                            className="w-full py-3 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all"
                          >
                            Generate Verification PIN
                          </button>
                       </div>
                    )) : (
                       <div className="py-12 text-center">
                          <Archive className="mx-auto mb-4 opacity-30" size={40} />
                          <p className="text-xs font-bold uppercase tracking-widest opacity-60">No active deployments</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Efficiency Overview */}
           <div className="bg-gray-900/50 rounded-[2.5rem] border border-white/5 p-8">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Efficiency Analytics</h3>
              <div className="h-[180px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            { name: 'Saved', value: stats?.detailed?.completed_count || 0, color: '#10b981' },
                            { name: 'Other', value: (stats?.detailed?.expired_count || 0) + (stats?.detailed?.active_count || 0), color: '#1e293b' }
                          ]}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={10}
                          dataKey="value"
                       >
                          <Cell fill="#10b981" />
                          <Cell fill="#1e293b" />
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-6 flex justify-between">
                 <div>
                    <p className="text-2xl font-black text-white">{stats?.detailed?.success_rate || 0}%</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">Operational Success</p>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-emerald-500">+{stats?.detailed?.impact_score || 0}</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">Impact Score</p>
                 </div>
              </div>
           </div>

           {/* Mobile Quick Action */}
           <div className="bg-gradient-to-br from-indigo-900/40 to-black rounded-[2rem] border border-white/5 p-6 border-dashed">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Zap size={20} />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Need Urgent Help?</p>
                    <p className="text-[10px] text-gray-500 font-medium">Connect with local NGO support directly.</p>
                 </div>
              </div>
              <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 transition-all">
                 Request Tactical Support
              </button>
           </div>
        </div>
      </div>

      {/* Verification Overlay */}
      <AnimatePresence>
        {verifyingClaimId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setVerifyingClaimId(null)} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-gray-950 p-8 rounded-[3rem] shadow-2xl max-w-sm w-full relative z-10 border border-white/10">
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                  <Shield className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white tracking-tight">Handover Secure PIN</h3>
                   <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed italic">"Provide this encrypted token to the field volunteer to authenticate the redistribution process."</p>
                </div>
                
                <div className="py-10 bg-white shadow-2xl shadow-emerald-500/5 items-center justify-center flex rounded-[2rem]">
                  <div className="text-6xl font-black tracking-[0.4em] text-black">
                    {activities.find(a => a.id === verifyingClaimId)?.pickup_otp || '----'}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                     SYNCHRONIZING WITH FIELD HANDSET...
                   </p>
                </div>

                <button onClick={() => setVerifyingClaimId(null)} className="w-full py-5 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-gray-300 rounded-2xl hover:bg-white/10 transition-all border border-white/10">
                  REVERT TO COMMAND
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
