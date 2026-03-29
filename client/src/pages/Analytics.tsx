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

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function Analytics() {
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
    <div className="space-y-8 pb-12">
      {/* Header Impact Header */}
      <div className="relative overflow-hidden bg-gray-950 rounded-3xl border border-white/5 p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent blur-3xl rounded-full translate-x-1/2" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Social Impact Profile</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                Level {Math.floor((data?.totals?.impact_score || 0) / 1000) + 1} Strategic Donor
              </span>
              <span className="text-gray-500 font-mono text-xs">· {donorProfile?.org_name || 'Individual Contributor'}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Impact Points</p>
              <p className="text-4xl font-black text-white leading-none">{data?.totals?.impact_score?.toLocaleString() || 0}</p>
           </div>
           <div className="w-px h-12 bg-white/10 mx-4 self-center" />
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Savings</p>
              <p className="text-4xl font-black text-emerald-400 leading-none">{data?.totals?.completed_kg?.toFixed(1) || 0}kg</p>
           </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "CO₂ Prevention", value: `${data?.totals?.co2_saved || 0}kg`, sub: "Environmental Benefit", icon: Leaf, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Community Meals", value: data?.totals?.meals_equivalent || 0, sub: "Feeding Impact", icon: Coffee, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Logistics Score", value: "94%", sub: "Efficiency Matrix", icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Growth Index", value: "+12.4%", sub: "MoM Growth", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`p-6 rounded-3xl border ${kpi.bg} backdrop-blur-md group hover:scale-[1.02] transition-transform`}
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-2xl bg-black/20 ${kpi.color}`}>
                  <kpi.icon size={20} />
               </div>
               <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">{kpi.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{kpi.label}</p>
            <p className="text-[10px] font-medium text-gray-600 mt-3">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Main Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Impact over Time Chart */}
          <div className="bg-gray-950 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-20">
                <ChevronRight className="text-emerald-500 w-12 h-12" />
             </div>
             <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                   <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                     Impact Velocity
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   </h3>
                   <p className="text-xs text-gray-500 font-medium">Food Redistribution performance across current cycle</p>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis 
                      dataKey="created_at" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' })} 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#impactGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Donation History Table */}
          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black tracking-tight">Lifecycle Asset Registry</h3>
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-white/10 hover:text-white transition-all">Export Report</div>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50 dark:bg-white/2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                         <th className="px-8 py-5">Asset Descriptor</th>
                         <th className="px-8 py-5">Inventory Mass</th>
                         <th className="px-8 py-5">Fulfillment Status</th>
                         <th className="px-8 py-5">Recipient NGO</th>
                         <th className="px-8 py-5">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {data?.listings?.map((listing: any) => (
                         <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-5">
                               <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{listing.title}</div>
                               <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">{listing.category}</div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="text-sm font-black text-gray-900 dark:text-gray-100">{listing.quantity}<span className="text-[10px] text-gray-500 ml-1 font-bold">{listing.quantity_unit}</span></div>
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
                               <div className="text-[11px] font-bold text-gray-400 group-hover:text-emerald-500 transition-colors">
                                  {listing.claims?.[0]?.ngo?.org_name || 'PENDING ASSIGNMENT'}
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="text-[10px] font-mono text-gray-500">{new Date(listing.created_at).toLocaleDateString()}</div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {(!data?.listings || data.listings.length === 0) && (
                  <div className="py-20 text-center text-gray-500 flex flex-col items-center">
                    <Package className="w-12 h-12 opacity-10 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">No assets found in the registry</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Side - Metrics */}
        <div className="space-y-8">
           {/* Listing Status Breakdown */}
           <div className="bg-gray-950 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Fulfillment Strategy</h3>
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
                       contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '10px' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-4 mt-8">
                 {statusDistribution.map((item, i) => (
                   <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{item.name}</span>
                     </div>
                     <span className="text-[11px] font-black text-white">{Math.round((item.value / (data?.listings?.length || 1)) * 100)}%</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Detailed Metrics Panel */}
           <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Info size={100} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-70">Sustainability Score</h3>
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-bold opacity-80">Food Utilization</p>
                          <p className="text-2xl font-black">88%</p>
                       </div>
                       <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '88%' }}
                            className="h-full bg-white"
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
