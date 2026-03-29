import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Truck, Users, CheckCircle, AlertCircle, TrendingUp, TrendingDown,
  Zap, MapPin, Clock, ArrowRight, Loader2, Leaf, Coins
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNgoStore } from '../../store/ngoStore';
import { supabase } from '../../lib/supabase';

const TASK_STATUS_COLORS: Record<string, string> = {
  completed: '#16a34a',
  in_progress: '#d97706',
  cancelled: '#dc2626',
  pending: '#6b7280',
};

function KpiCard({ icon: Icon, label, value, sub, color, trend, loading }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-gray-800 rounded animate-pulse" />
      ) : (
        <div className="text-2xl font-bold text-white">{value}</div>
      )}
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-teal-400 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export function NgoDashboard() {
  const { ngo, analytics, volunteers, claims, tasks, activeTasks, aiBriefing, aiSuggestions,
    fetchNgo, fetchAnalytics, fetchVolunteers, fetchClaims, fetchTasks, fetchActiveTasks, fetchAiBriefing, fetchAiSuggestions } = useNgoStore();
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);
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

  // Real-time: subscribe to volunteer changes
  useEffect(() => {
    const channel = supabase.channel('ngo-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers' }, () => {
        fetchVolunteers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_tasks' }, (payload) => {
        setActivity(prev => [{
          type: 'task_update',
          message: `Task status updated: ${(payload.new as any)?.status}`,
          time: new Date().toISOString(),
        }, ...prev.slice(0, 19)]);
        fetchActiveTasks();
        fetchTasks();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ngo_food_claims' }, (payload) => {
        setActivity(prev => [{
          type: 'new_claim',
          message: `New food claim created`,
          time: new Date().toISOString(),
        }, ...prev.slice(0, 19)]);
        fetchClaims();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const pendingClaims = claims.filter(c => c.status === 'pending_assignment');
  const availableVols = volunteers.filter(v => v.availability_status === 'available' && v.status === 'active');
  const onTaskVols = volunteers.filter(v => v.availability_status === 'on_task');

  // Build chart data from tasks
  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#16a34a' },
    { name: 'In Progress', value: activeTasks.length, color: '#d97706' },
    { name: 'Cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  // Generate bar data for last 7 days
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
      {/* AI Briefing */}
      {aiBriefing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1">FoodBridge AI · Daily Briefing</div>
            <p className="text-sm text-gray-200">{aiBriefing}</p>
          </div>
        </motion.div>
      )}

      {/* Urgent Banner */}
      {(pendingClaims.length > 0 || onTaskVols.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingClaims.length > 0 && (
            <button onClick={() => navigate('/ngo/tasks')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-all">
              <AlertCircle size={14} />
              {pendingClaims.length} claim{pendingClaims.length > 1 ? 's' : ''} need volunteer assignment
              <ArrowRight size={14} />
            </button>
          )}
          {availableVols.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <Users size={14} />
              {availableVols.length} volunteer{availableVols.length > 1 ? 's' : ''} available now
            </div>
          )}
          {onTaskVols.length > 0 && (
            <button onClick={() => navigate('/ngo/tracking')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm hover:bg-teal-500/20 transition-all">
              <MapPin size={14} />
              {onTaskVols.length} volunteer{onTaskVols.length > 1 ? 's' : ''} in the field
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={Package} label="Kg received this month" value={analytics ? `${analytics.total_kg_received.toFixed(0)} kg` : '—'} color="bg-teal-500/20 text-teal-400" loading={analyticsLoading} />
        <KpiCard icon={CheckCircle} label="Meals estimated" value={analytics ? analytics.total_meals_estimated.toLocaleString() : '—'} color="bg-green-500/20 text-green-400" loading={analyticsLoading} />
        <KpiCard icon={Truck} label="Tasks completed" value={analytics ? analytics.tasks_completed : '—'} color="bg-blue-500/20 text-blue-400" loading={analyticsLoading} />
        <KpiCard icon={Users} label="Available volunteers" value={availableVols.length} color="bg-purple-500/20 text-purple-400" sub="real-time" loading={analyticsLoading} />
        <KpiCard icon={Leaf} label="CO₂ saved" value={analytics ? `${analytics.co2_saved_kg.toFixed(0)} kg` : '—'} color="bg-emerald-500/20 text-emerald-400" loading={analyticsLoading} />
        <KpiCard icon={Coins} label="Food value saved" value={analytics ? `₹${analytics.food_value_saved_inr.toLocaleString()}` : '—'} color="bg-yellow-500/20 text-yellow-400" loading={analyticsLoading} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Week Bar Chart */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="text-sm font-semibold text-white mb-4">Tasks Completed — Last 7 Days</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekBarData}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize:12 }} />
                <Bar dataKey="tasks" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Active Tasks */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Active Pickups</div>
              <button onClick={() => navigate('/ngo/tracking')} className="text-xs text-teal-400 hover:underline flex items-center gap-1">View Map <ArrowRight size={12} /></button>
            </div>
            {activeTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No active pickups right now</div>
            ) : (
              <div className="space-y-3">
                {activeTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-white/5 hover:border-white/10 cursor-pointer" onClick={() => navigate('/ngo/tracking')}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status.includes('pickup') ? 'bg-blue-400' :
                      task.status === 'picked_up' || task.status.includes('delivery') ? 'bg-green-400' : 'bg-amber-400'
                    } animate-pulse`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{(task.ngo_food_claims as any)?.food_listings?.title || 'Food Pickup'}</div>
                      <div className="text-xs text-gray-500">{task.volunteer?.full_name || 'No volunteer'} · {task.status.replace(/_/g, ' ')}</div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      task.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      task.status.includes('pickup') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>{task.status.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Task Status Donut */}
          {taskStatusData.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <div className="text-sm font-semibold text-white mb-4">Task Status Breakdown</div>
              <PieChart width={180} height={120}>
                <Pie data={taskStatusData} cx={85} cy={55} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-1.5 mt-2">
                {taskStatusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</div>
                    <span className="text-gray-400">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-purple-400" />
                <div className="text-sm font-semibold text-white">AI Assignment Suggestions</div>
              </div>
              <div className="space-y-3">
                {aiSuggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                    <div className="text-xs text-white font-medium">{s.food_title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">→ {s.volunteer_name} ({s.distance_km}km away)</div>
                    <div className="text-xs text-purple-400 mt-1">{s.reason}</div>
                    <button
                      onClick={() => navigate('/ngo/tasks')}
                      className="mt-2 text-xs text-teal-400 hover:text-teal-300"
                    >
                      Assign on Task Board →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Volunteer Status */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Volunteer Status</div>
              <button onClick={() => navigate('/ngo/volunteers')} className="text-xs text-teal-400 hover:underline">Manage</button>
            </div>
            {volunteers.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No volunteers yet. <button onClick={() => navigate('/ngo/volunteers')} className="text-teal-400 hover:underline">Add one</button></div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Available', count: availableVols.length, color: 'bg-green-400' },
                  { label: 'On Task', count: onTaskVols.length, color: 'bg-amber-400' },
                  { label: 'On Break', count: volunteers.filter(v=>v.availability_status==='break').length, color: 'bg-blue-400' },
                  { label: 'Offline', count: volunteers.filter(v=>v.availability_status==='offline').length, color: 'bg-gray-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />{item.label}
                    </div>
                    <span className="text-xs font-medium text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
