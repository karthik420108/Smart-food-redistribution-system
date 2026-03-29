import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  MapPin,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { MockMap } from '../components/MockMap';

const COLORS = ['#16A34A', '#EAB308', '#EF4444', '#94a3b8'];

export function DashboardOverview() {
  const { user, donorProfile } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, weekly] = await Promise.all([
          apiFetch('/analytics/overview'),
          apiFetch('/analytics/weekly')
        ]);
        setStats(overview);
        setWeeklyData(weekly);

        // Fetch recent claims AND recent listings for a complete activity feed
        const [{ data: claims }, { data: newListings }] = await Promise.all([
          supabase.from('claims').select('*, food_listings(title, donor_id)').eq('food_listings.donor_id', donorProfile?.id).limit(5).order('created_at', { ascending: false }),
          supabase.from('food_listings').select('*').eq('donor_id', donorProfile?.id).limit(5).order('created_at', { ascending: false })
        ]);

        const combinedActivities = [
          ...(claims || []).map(c => ({ ...c, activity_type: 'claim' })),
          ...(newListings || []).map(l => ({ ...l, activity_type: 'listing' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        setActivities(combinedActivities);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claims' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse text-lg">Syncing FoodBridge Intelligence...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const statusData = stats ? [
    { name: 'Available', value: stats.statusDistribution.available },
    { name: 'Claimed', value: stats.statusDistribution.claimed },
    { name: 'Completed', value: stats.statusDistribution.completed },
    { name: 'Expired', value: stats.statusDistribution.expired },
  ].filter(s => s.value > 0) : [];

  const markers = stats?.nearbyActivity?.map((act: any) => ({
    lat: act.lat,
    lng: act.lng,
    label: act.label,
    type: act.type as 'donor' | 'receiver'
  })) || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {donorProfile?.full_name?.split(' ')[0] || 'Donor'}!</h1>
        {statusData.find(s => s.name === 'Expired')?.value > 0 && (
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Check your listings: {statusData.find(s => s.name === 'Expired')?.value} expired
          </div>
        )}
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Food Saved", value: `${stats?.totalSavedKg || 0} kg`, icon: Heart, color: "text-red-500", bg: "bg-red-50" },
          { label: "Meals Provided", value: stats?.mealsProvided?.toLocaleString() || "0", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "NGOs Helped", value: stats?.ngosHelped || "0", icon: MapPin, color: "text-green-500", bg: "bg-green-50" },
          { label: "CO₂ Offset", value: `${stats?.co2Offset || 0} kg`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-full ${stat.bg} ${stat.color} dark:bg-opacity-10`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold mb-6">Weekly Donation Volume (kg)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="kg" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4">Listing Status</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Live Activity</h3>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 py-3 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 px-2 rounded-lg transition-colors overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.activity_type === 'claim' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                  }`}>
                  {activity.activity_type === 'claim' ? <Heart className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  {activity.activity_type === 'claim' ? (
                    <p className="text-sm font-medium truncate">Matched NGO <span className="text-gray-500 font-normal">claimed {activity.quantity_claimed}kg of {activity.food_listings?.title || 'Food Item'}</span></p>
                  ) : (
                    <p className="text-sm font-medium truncate">Asset Published: <span className="text-gray-500 font-normal">{activity.title} ({activity.quantity}{activity.quantity_unit})</span></p>
                  )}
                  <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleTimeString()}</p>
                </div>
                <Link to={`/listings/${activity.activity_type === 'claim' ? activity.listing_id : activity.id}`} className="text-sm text-primary font-medium hover:underline flex-shrink-0">View</Link>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-xl">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No activity recorded yet</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-950 p-6 rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Nearby Network</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE OPTIMIZATION
            </div>
          </div>
          <MockMap
            className="flex-1 min-h-[250px]"
            center={donorProfile?.lat && donorProfile?.lng ? { lat: donorProfile.lat, lng: donorProfile.lng } : { lat: 19.0760, lng: 72.8777 }}
            markers={markers}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
