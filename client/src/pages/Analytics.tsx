import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Leaf, Coffee, Award, Shield, 
  ChevronRight, Calendar, Info, ArrowUpRight, ArrowDownRight,
  Package, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function Analytics() {
  const { isDark } = useTheme();
  const { donorProfile } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const res = await apiFetch('/analytics/detailed');
        setData(res);
      } catch (err) {
        console.error('Failed to fetch detailed analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailedData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Analyzing Impact DNA...</p>
      </div>
    );
  }

  const statusDistribution = [
    { name: 'Completed', value: data?.listings?.filter((l: any) => l.status === 'completed').length || 0 },
    { name: 'Active', value: data?.listings?.filter((l: any) => !['completed', 'expired'].includes(l.status)).length || 0 },
    { name: 'Expired', value: data?.listings?.filter((l: any) => l.status === 'expired').length || 0 },
  ].filter(s => s.value > 0);

  const categoryData = data?.listings?.reduce((acc: any[], curr: any) => {
    const existing = acc.find(a => a.name === curr.category);
    if (existing) existing.value += 1;
    else acc.push({ name: curr.category, value: 1 });
    return acc;
  }, []).sort((a: any, b: any) => b.value - a.value).slice(0, 5) || [];

  return (
    <div className={`space-y-8 pb-12 transition-colors duration-300 relative ${
      isDark ? 'bg-slate-950' : 'bg-gray-50'
    }`}>
      {/* HUD GRID BACKGROUND */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#1e293b' : '#e2e8f0'} 1px, transparent 0)`,
        backgroundSize: '48px 48px',
        maskImage: `radial-gradient(circle 600px at 400px 300px, black 0%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle 600px at 400px 300px, black 0%, transparent 100%)`,
        zIndex: 0
      }} />
      {/* Header Impact Header */}
      <div className={`relative overflow-hidden rounded-3xl border p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl transition-all duration-300 ${
        isDark 
          ? 'bg-slate-900/95 border-emerald-500/10' 
          : 'bg-white/95 border-emerald-200/30'
      }`}>
        <div className={`absolute top-0 right-0 w-1/3 h-full blur-3xl rounded-full translate-x-1/2 transition-opacity duration-300 ${
          isDark 
            ? 'bg-gradient-to-l from-emerald-500/10 to-transparent' 
            : 'bg-gradient-to-l from-emerald-500/5 to-transparent'
        }`} />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className={`text-3xl font-black tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Social Impact Profile</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                Level {Math.floor((data?.totals?.impact_score || 0) / 1000) + 1} Strategic Donor
              </span>
              <span className={`font-mono text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}>· {donorProfile?.name || 'Individual Contributor'}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
           <div className="text-right">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-300 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}>Impact Points</p>
              <p className={`text-4xl font-black leading-none transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{data?.totals?.impact_score?.toLocaleString() || 0}</p>
           </div>
           <div className={`w-px h-12 mx-4 self-center transition-colors duration-300 ${
              isDark ? 'bg-white/10' : 'bg-gray-300/50'
           }`} />
           <div className="text-right">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-300 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}>Total Savings</p>
              <p className={`text-4xl font-black leading-none transition-colors duration-300 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>{data?.totals?.completed_kg?.toFixed(1) || 0}kg</p>
           </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "CO₂ Prevention", value: `${data?.totals?.co2_saved || 0}kg`, sub: "Environmental Benefit", icon: Leaf, color: "text-emerald-400", bg: isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200/30" },
          { label: "Community Meals", value: data?.totals?.meals_equivalent || 0, sub: "Feeding Impact", icon: Coffee, color: "text-amber-400", bg: isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200/30" },
          { label: "Logistics Score", value: "94%", sub: "Efficiency Matrix", icon: Shield, color: "text-blue-400", bg: isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200/30" },
          { label: "Growth Index", value: "+12.4%", sub: "MoM Growth", icon: TrendingUp, color: "text-purple-400", bg: isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200/30" },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`p-6 rounded-3xl border ${kpi.bg} backdrop-blur-md group hover:scale-[1.02] transition-transform`}
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-black/10'} ${kpi.color}`}>
                  <kpi.icon size={20} />
               </div>
               <ArrowUpRight size={14} className={`transition-colors ${
                 isDark ? 'text-gray-600 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'
               }`} />
            </div>
            <p className={`text-2xl font-black tracking-tighter transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{kpi.value}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>{kpi.label}</p>
            <p className={`text-[10px] font-medium mt-3 transition-colors duration-300 ${
              isDark ? 'text-gray-600' : 'text-gray-700'
            }`}>{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Main Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Impact over Time Chart */}
          <div className={`rounded-[2.5rem] border p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            isDark 
              ? 'bg-slate-900/95 border-emerald-500/10' 
              : 'bg-white/95 border-emerald-200/30'
          }`}>
             <div className={`absolute top-0 right-0 p-8 transition-opacity duration-300 ${
               isDark ? 'opacity-20' : 'opacity-10'
             }`}>
                <ChevronRight className="text-emerald-500 w-12 h-12" />
             </div>
             <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                   <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 transition-colors duration-300 ${
                     isDark ? 'text-white' : 'text-gray-900'
                   }`}>
                     Impact Velocity
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   </h3>
                   <p className={`text-xs font-medium transition-colors duration-300 ${
                     isDark ? 'text-gray-500' : 'text-gray-600'
                   }`}>Food Redistribution performance across current cycle</p>
                </div>
             </div>
             <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.listings?.slice(0, 10).reverse() || []}>
                    <defs>
                      <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="created_at" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' })} 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: isDark ? '#6b7280' : '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6b7280' : '#4b5563', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: isDark ? '#1f2937' : '#ffffff', 
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, 
                        borderRadius: '16px', 
                        fontSize: '11px', 
                        fontWeight: 'bold' 
                      }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#impactGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Donation History Table */}
          <div className={`rounded-[2.5rem] border overflow-hidden shadow-2xl transition-all duration-300 ${
            isDark 
              ? 'bg-slate-900/95 border-emerald-500/10' 
              : 'bg-white/95 border-emerald-200/30'
          }`}>
             <div className={`p-8 border-b flex justify-between items-center transition-colors duration-300 ${
               isDark ? 'border-emerald-500/10' : 'border-emerald-200/30'
             }`}>
                <h3 className={`text-xl font-black tracking-tight transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Lifecycle Asset Registry</h3>
                <div className="flex gap-2">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer hover:scale-[1.02] transition-all ${
                    isDark 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}>Export Report</div>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
                        isDark ? 'text-gray-500 bg-white/2' : 'text-gray-600 bg-gray-50'
                      }`}>
                         <th className="px-8 py-5">Asset Descriptor</th>
                         <th className="px-8 py-5">Inventory Mass</th>
                         <th className="px-8 py-5">Fulfillment Status</th>
                         <th className="px-8 py-5">Recipient NGO</th>
                         <th className="px-8 py-5">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className={`transition-colors duration-300 ${
                     isDark ? 'divide-white/5' : 'divide-gray-100'
                   }`}>
                      {data?.listings?.map((listing: any) => (
                         <tr key={listing.id} className={`transition-colors group ${
                           isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                         }`}>
                            <td className="px-8 py-5">
                               <div className={`text-sm font-bold transition-colors duration-300 ${
                                 isDark ? 'text-gray-100' : 'text-gray-900'
                               }`}>{listing.title}</div>
                               <div className={`text-[10px] font-mono uppercase mt-1 transition-colors duration-300 ${
                                 isDark ? 'text-gray-500' : 'text-gray-600'
                               }`}>{listing.category}</div>
                            </td>
                            <td className="px-8 py-5">
                               <div className={`text-sm font-black transition-colors duration-300 ${
                                 isDark ? 'text-gray-100' : 'text-gray-900'
                               }`}>{listing.quantity}<span className={`text-[10px] ml-1 font-bold transition-colors duration-300 ${
                                 isDark ? 'text-gray-500' : 'text-gray-600'
                               }`}>{listing.quantity_unit}</span></div>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${
                                  listing.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                  listing.status === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                               }`}>
                                  {listing.status}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                               <div className={`text-[11px] font-bold transition-colors duration-300 group-hover:text-emerald-500 ${
                                 isDark ? 'text-gray-400' : 'text-gray-600'
                               }`}>
                                  {listing.claims?.[0]?.ngo?.org_name || 'PENDING ASSIGNMENT'}
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className={`text-[10px] font-mono transition-colors duration-300 ${
                                 isDark ? 'text-gray-500' : 'text-gray-600'
                               }`}>{new Date(listing.created_at).toLocaleDateString()}</div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {(!data?.listings || data.listings.length === 0) && (
                  <div className={`py-20 text-center flex flex-col items-center transition-colors duration-300 ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    <Package className={`w-12 h-12 mb-4 transition-opacity duration-300 ${
                      isDark ? 'opacity-20' : 'opacity-30'
                    }`} />
                    <p className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}>No assets found in registry</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Side - Metrics */}
        <div className="space-y-8">
           {/* Listing Status Breakdown */}
           <div className={`rounded-[2.5rem] border p-8 shadow-2xl transition-all duration-300 ${
             isDark 
               ? 'bg-slate-900/95 border-emerald-500/10' 
               : 'bg-white/95 border-emerald-200/30'
           }`}>
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Fulfillment Strategy</h3>
              <div className="flex justify-center h-[180px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={statusDistribution}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={8}
                       dataKey="value"
                     >
                       {statusDistribution.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                       ))}
                     </Pie>
                     <Tooltip 
                      contentStyle={{ 
                        background: isDark ? '#1f2937' : '#ffffff', 
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, 
                        borderRadius: '12px', 
                        fontSize: '10px' 
                      }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-4 mt-8">
                 {statusDistribution.map((item, i) => (
                   <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                         isDark ? 'text-gray-400' : 'text-gray-700'
                       }`}>{item.name}</span>
                     </div>
                     <span className="text-[11px] font-black text-white">{Math.round((item.value / (data?.listings?.length || 1)) * 100)}%</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Detailed Metrics Panel */}
           <div className={`rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group transition-all duration-300 ${
             isDark 
               ? 'bg-slate-900/95 text-white border-emerald-500/10' 
               : 'bg-white/95 text-gray-900 border-emerald-200/30'
           }`}>
              <div className={`absolute top-0 right-0 p-8 transition-opacity duration-300 ${
                isDark ? 'opacity-10' : 'opacity-20'
              } group-hover:scale-110 transition-transform`}>
                 <Info size={100} />
              </div>
              <div className="relative z-10">
                 <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 transition-colors duration-300 ${
                   isDark ? 'text-white opacity-70' : 'text-gray-900 opacity-80'
                 }`}>Sustainability Score</h3>
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <p className={`text-sm font-bold transition-colors duration-300 ${
                            isDark ? 'text-gray-300 opacity-80' : 'text-gray-700 opacity-80'
                          }`}>Food Utilization</p>
                          <p className={`text-2xl font-black transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>88%</p>
                       </div>
                       <div className={`h-1.5 w-full rounded-full overflow-hidden transition-colors duration-300 ${
                       isDark ? 'bg-white/20' : 'bg-gray-200'
                     }`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '88%' }}
                            className={`h-full transition-colors duration-300 ${
                              isDark ? 'bg-white' : 'bg-gray-900'
                            }`}
                          />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-bold opacity-80">CO2 Prevention Goal</p>
                          <p className="text-2xl font-black">{data?.totals?.co2_saved || 0}/500</p>
                       </div>
                       <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((data?.totals?.co2_saved || 0) / 500) * 100)}%` }}
                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          />
                       </div>
                    </div>
                 </div>
                 <div className="mt-8 pt-8 border-t border-white/20">
                    <p className="text-[10px] font-bold leading-relaxed opacity-70">
                       You have prevented the equivalent of planting {(data?.totals?.co2_saved / 20).toFixed(1) || 0} mature trees this year through strategic redistribution.
                    </p>
                 </div>
              </div>
           </div>

           {/* Category Pie */}
           <div className="bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/5 p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6">Inventory Mix</h3>
              <div className="space-y-4">
                 {categoryData.map((cat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/20 hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                             <Coffee size={14} className="text-emerald-500" />
                          </div>
                          <span className="text-[11px] font-bold uppercase text-gray-500 tracking-tight">{cat.name}</span>
                       </div>
                       <span className="text-xs font-black text-gray-900 dark:text-white">{cat.value} items</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
