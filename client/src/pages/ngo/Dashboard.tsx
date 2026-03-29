import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Truck, CheckCircle, AlertCircle, TrendingUp,
  Zap, MapPin, ArrowRight, Leaf, Award, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNgoStore } from '../../store/ngoStore';
import { supabase } from '../../lib/supabase';
import { socket } from '../../lib/socket';
import toast from 'react-hot-toast';

function KpiCard({ icon: Icon, label, value, sub, color, trend, loading, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 hover:border-teal-500/20 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
            trend >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
        ) : (
          <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        )}
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
        {sub && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <div className="text-[10px] font-semibold text-teal-400/80 uppercase">{sub}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActivityStream({ tasks, claims }: { tasks: any[], claims: any[] }) {
  const activities = [
    ...tasks.map(t => ({
      id: `task-${t.id}`,
      type: 'task',
      title: t.status === 'completed' ? 'Redistribution Successful' : 'Task Status Updated',
      desc: `${t.volunteer?.full_name || 'Volunteer'} updated status to ${t.status.replace(/_/g, ' ')}`,
      time: new Date(t.updated_at || t.assigned_at),
      icon: <Truck size={14} />,
      color: t.status === 'completed' ? 'text-green-400 bg-green-400/10' : 'text-blue-400 bg-blue-400/10'
    })),
    ...claims.filter(c => c.status === 'pending_assignment').map(c => ({
      id: `claim-${c.id}`,
      type: 'claim',
      title: 'Action Required',
      desc: `New food claim from ${(c.food_listings as any)?.donors?.full_name || 'Donor'} needs assignment`,
      time: new Date(c.created_at),
      icon: <AlertCircle size={14} />,
      color: 'text-amber-400 bg-amber-400/10'
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <History size={14} className="text-teal-400" />
          Live Command Stream
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
        </div>
      </div>
      <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
        {activities.length > 0 ? activities.map((act, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={act.id}
            className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
          >
            <div className={`w-8 h-8 rounded-lg ${act.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {act.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="text-xs font-bold text-gray-200 truncate">{act.title}</div>
                <div className="text-[10px] text-gray-500 whitespace-nowrap">{
                   new Date().getTime() - act.time.getTime() < 60000 ? 'Just now' :
                   new Date().getTime() - act.time.getTime() < 3600000 ? `${Math.floor((new Date().getTime() - act.time.getTime())/60000)}m ago` :
                   act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }</div>
              </div>
              <div className="text-[11px] text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{act.desc}</div>
            </div>
          </motion.div>
        )) : (
          <div className="py-20 text-center text-gray-600 text-xs italic">No recent activity detected</div>
        )}
      </div>
    </div>
  );
}

export function NgoDashboard() {
  const { ngo, analytics, volunteers, claims, tasks, activeTasks, aiBriefing, aiSuggestions,
    fetchNgo, fetchAnalytics, fetchVolunteers, fetchClaims, fetchTasks, fetchActiveTasks, fetchAiBriefing, fetchAiSuggestions } = useNgoStore();
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchNgo(),
        fetchAnalytics('month'),
        fetchVolunteers(),
        fetchClaims(),
        fetchTasks(),
        fetchActiveTasks(),
        fetchAiBriefing(),
        fetchAiSuggestions(),
      ]);
      setAnalyticsLoading(false);
    };
    init();
  }, []);

  // Socket.io Real-time
  useEffect(() => {
    if (ngo?.id) {
      socket.connect();
      socket.emit('join_ngo', ngo.id);

      socket.on('task_status_updated', (data: any) => {
        toast.success(`Volunteer ${data.volunteer_name || 'Assigned'} updated status to: ${data.status.replace(/_/g, ' ')}`, {
          icon: '🚚',
          duration: 4000
        });
        fetchActiveTasks();
        fetchTasks();
      });

      socket.on('otp_verified', (data: any) => {
        toast.success(`Pickup Verified! ${data.volunteer_name} has collected food from ${data.donor_name}`, {
          icon: '✅',
          duration: 6000
        });
        fetchActiveTasks();
        fetchClaims();
        fetchTasks();
      });

      socket.on('new_claim_alert', () => {
        toast('New food donation claimed and ready for assignment!', { icon: '🎁' });
        fetchClaims();
      });
    }

    return () => {
      socket.off('task_status_updated');
      socket.off('otp_verified');
      socket.off('new_claim_alert');
    };
  }, [ngo?.id]);

  // Real-time: subscribe to volunteer changes
  useEffect(() => {
    const channel = supabase.channel('ngo-realtime-fallback')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers' }, () => {
        fetchVolunteers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_tasks' }, () => {
        fetchActiveTasks();
        fetchTasks();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ngo_food_claims' }, () => {
        fetchClaims();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const pendingClaims = claims.filter(c => c.status === 'pending_assignment');
  const availableVols = volunteers.filter(v => v.availability_status === 'available' && v.status === 'active');
  const onTaskVols = volunteers.filter(v => v.availability_status === 'on_task');

  // Build chart data
  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#14b8a6' },
    { name: 'In Progress', value: activeTasks.length, color: '#f59e0b' },
    { name: 'Cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const weekBarData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const dayTasks = tasks.filter(t => {
      const td = new Date(t.assigned_at);
      return td.toDateString() === d.toDateString() && t.status === 'completed';
    });
    return { day: label, tasks: dayTasks.length };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Points Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Command Center
            <span className="text-teal-500 font-mono text-sm px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20">NGO_{ngo?.id?.slice(0,5)}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time logistics monitoring & impact tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Award className="text-amber-400" size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">Growth Points</div>
              <div className="text-lg font-black text-amber-400 leading-none">{analytics?.points?.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      {aiBriefing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/20 border border-purple-500/20 rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Zap size={100} className="text-purple-400" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/10">
            <Zap size={20} className="text-purple-400" />
          </div>
          <div className="relative z-10">
            <div className="text-xs text-purple-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
              Neural Assistant Briefing
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed font-medium">{aiBriefing}</p>
          </div>
        </motion.div>
      )}

      {/* Urgent Banners */}
      {(pendingClaims.length > 0 || onTaskVols.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {pendingClaims.length > 0 && (
            <motion.button 
              whileHover={{ x: 5 }}
              onClick={() => navigate('/ngo/tasks')} 
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/5 group"
            >
              <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center animate-pulse">
                <AlertCircle size={14} />
              </div>
              {pendingClaims.length} Critical Assignments Pending
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
          {onTaskVols.length > 0 && (
            <motion.button 
              whileHover={{ x: 5 }}
              onClick={() => navigate('/ngo/tracking')} 
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider hover:bg-teal-500/20 transition-all shadow-lg shadow-teal-500/5 group"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <MapPin size={14} className="animate-bounce" />
              </div>
              {onTaskVols.length} Active Field Deployments
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard 
          icon={Package} 
          label="Logistics Volume (Kg)" 
          value={analytics ? `${(analytics.total_kg_received || 0).toFixed(1)}` : '—'} 
          sub="Direct Impact" 
          color="bg-teal-500/20 text-teal-400" 
          trend={(analytics?.total_kg_received || 0) > 0 ? 12 : 0} 
          loading={analyticsLoading} 
          delay={1} 
        />
        <KpiCard 
          icon={CheckCircle} 
          label="Redistributed Meals" 
          value={analytics ? (analytics.total_meals_estimated || 0).toLocaleString() : '—'} 
          sub="Community Feeding" 
          color="bg-emerald-500/20 text-emerald-400" 
          trend={(analytics?.total_meals_estimated || 0) > 0 ? 8 : 0} 
          loading={analyticsLoading} 
          delay={2} 
        />
        <KpiCard 
          icon={Leaf} 
          label="Carbon Offset (Kg)" 
          value={analytics ? `${(analytics.co2_saved_kg || 0).toFixed(0)}` : '—'} 
          sub="Environmental" 
          color="bg-green-500/20 text-green-400" 
          trend={(analytics?.co2_saved_kg || 0) > 0 ? 15 : 0} 
          loading={analyticsLoading} 
          delay={3} 
        />
        <KpiCard 
          icon={Truck} 
          label="Success Rate" 
          value={tasks.length > 0 ? 
            `${((tasks.filter(t => t.status === 'completed').length / (tasks.filter(t => t.status !== 'cancelled').length || 1)) * 100).toFixed(1)}%` 
            : '100%'} 
          sub="Operation Velocity" 
          color="bg-blue-500/20 text-blue-400" 
          trend={2} 
          loading={analyticsLoading} 
          delay={4} 
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityStream tasks={tasks} claims={claims} />
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 space-y-4">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={14} className="text-teal-400" />
                 Redistribution Velocity
               </div>
               <ResponsiveContainer width="100%" height={220}>
                 <BarChart data={weekBarData}>
                   <defs>
                     <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8}/>
                       <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.2}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="day" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize:11 }} />
                   <Bar dataKey="tasks" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Truck size={14} className="text-teal-400" />
                Active Logistics Map
              </div>
              <button onClick={() => navigate('/ngo/tracking')} className="text-[10px] font-bold text-teal-400 uppercase tracking-widest hover:text-teal-300 flex items-center gap-1 transition-colors">
                Full Systems View <ArrowRight size={10} />
              </button>
            </div>
            {activeTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-600 text-xs">No active deployments currently monitored</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-teal-500/20 transition-all cursor-pointer group" onClick={() => navigate('/ngo/tracking')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'picked_up' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'} animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-gray-200 truncate uppercase tracking-tight">{task.volunteer?.full_name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{task.status.replace(/_/g, ' ')}</div>
                      </div>
                      <ArrowRight size={12} className="text-gray-700 group-hover:text-teal-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-white/5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resource Distribution</div>
            <div className="flex justify-center">
              <PieChart width={160} height={160}>
                <Pie data={taskStatusData} cx={80} cy={80} innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-3 mt-4">
              {taskStatusData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-400">{d.name}</span>
                  </div>
                  <span className="text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-purple-400" />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Neural Logistics Advice</div>
              </div>
              <div className="space-y-3">
                {aiSuggestions.slice(0, 2).map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all">
                    <div className="text-[11px] text-white font-bold uppercase tracking-tight">{s.food_title}</div>
                    <div className="text-[10px] text-purple-400 mt-1 uppercase font-bold">Assign to {s.volunteer_name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 leading-relaxed italic">"{s.reason}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deployment Status</div>
              <button onClick={() => navigate('/ngo/volunteers')} className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Manage</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tactical (Available)', count: availableVols.length, color: 'bg-green-400' },
                { label: 'Deployed (On Task)', count: onTaskVols.length, color: 'bg-amber-400' },
                { label: 'Standby (Offline)', count: volunteers.filter(v => v.availability_status === 'offline' || v.availability_status === 'break').length, color: 'bg-gray-600' },
              ].map(item => (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{item.label}</span>
                    <span className="text-xs font-black text-white">{item.count}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(volunteers.length ? (item.count / volunteers.length) * 100 : 0)}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
