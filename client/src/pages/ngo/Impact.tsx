import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Coins, Heart, TrendingUp, Award, Download, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNgoStore } from '../../store/ngoStore';

export function ImpactPage() {
  const { analytics, tasks, fetchAnalytics } = useNgoStore();
  const [period, setPeriod] = useState('month');

  useEffect(() => { fetchAnalytics(period); }, [period]);

  const kpiCards = [
    { label: 'Total kg Collected', value: `${analytics?.total_kg_received?.toFixed(0) || 0} kg`, icon: '📦', color: 'from-teal-500/30 to-teal-600/20 border-teal-500/20 text-teal-400' },
    { label: 'Meals Provided', value: `${analytics?.total_meals_estimated?.toLocaleString() || 0}`, icon: '🍽️', color: 'from-green-500/30 to-green-600/20 border-green-500/20 text-green-400' },
    { label: 'CO₂ Offset', value: `${analytics?.co2_saved_kg?.toFixed(0) || 0} kg`, icon: '🌿', color: 'from-emerald-500/30 to-emerald-600/20 border-emerald-500/20 text-emerald-400' },
    { label: 'Food Value Saved', value: `₹${analytics?.food_value_saved_inr?.toLocaleString() || 0}`, icon: '💰', color: 'from-yellow-500/30 to-yellow-600/20 border-yellow-500/20 text-yellow-400' },
    { label: 'Tasks Completed', value: `${analytics?.tasks_completed || 0}`, icon: '✅', color: 'from-blue-500/30 to-blue-600/20 border-blue-500/20 text-blue-400' },
    { label: 'Active Volunteers', value: `${analytics?.total_volunteers || 0}`, icon: '👥', color: 'from-purple-500/30 to-purple-600/20 border-purple-500/20 text-purple-400' },
  ];

  // Build trend data from tasks
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthTasks = tasks.filter(t => {
      const td = new Date(t.assigned_at);
      return td.getMonth() === d.getMonth() && t.status === 'completed';
    });
    const kgTotal = monthTasks.reduce((sum, t) => sum + (t.actual_kg_collected || 0), 0);
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      kg: Math.round(kgTotal),
      meals: Math.round(kgTotal * 2.5),
      tasks: monthTasks.length,
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Impact Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your food redistribution impact at a glance</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                period === p ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}>{p}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-xs hover:bg-white/5">
          <Download size={13} /> Export
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 border bg-gradient-to-br ${card.color} text-center`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className={`text-xl font-bold ${card.color.includes('teal') ? 'text-teal-400' : card.color.includes('green') ? 'text-green-400' : card.color.includes('emerald') ? 'text-emerald-400' : card.color.includes('yellow') ? 'text-yellow-400' : card.color.includes('blue') ? 'text-blue-400' : 'text-purple-400'}`}>
              {card.value}
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-tight">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend Area */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="text-sm font-semibold text-white mb-4">Kg Collected — 6 Month Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="kgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Area type="monotone" dataKey="kg" stroke="#0d9488" strokeWidth={2} fill="url(#kgGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Tasks Bar */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="text-sm font-semibold text-white mb-4">Tasks Completed — Monthly</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="tasks" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} className="text-yellow-400" />
          <div className="text-sm font-semibold text-white">Achievements</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '1,000 Meals', icon: '🍽️', achieved: (analytics?.total_meals_estimated || 0) >= 1000 },
            { label: '100 kg Collected', icon: '📦', achieved: (analytics?.total_kg_received || 0) >= 100 },
            { label: '50 Tasks Done', icon: '✅', achieved: (analytics?.tasks_completed || 0) >= 50 },
            { label: '5 Active Volunteers', icon: '👥', achieved: (analytics?.total_volunteers || 0) >= 5 },
          ].map((a, i) => (
            <div key={i} className={`p-4 rounded-xl border text-center transition-all ${
              a.achieved ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-white/5 bg-gray-800/30 opacity-40'
            }`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className={`text-xs font-medium ${a.achieved ? 'text-yellow-400' : 'text-gray-500'}`}>{a.label}</div>
              {a.achieved && <div className="text-xs text-yellow-600 mt-0.5">Achieved ✓</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
