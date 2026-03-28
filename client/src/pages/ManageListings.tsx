import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, FileDown, Plus, Trash2, ExternalLink, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function ManageListings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('All');
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = ['All', 'Available', 'Claimed', 'Completed', 'Expired'];

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('food_listings')
        .select('*, claims(count)')
        .order('created_at', { ascending: false });

      if (activeTab !== 'All') {
        query = query.eq('status', activeTab.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      setListings(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchListings();
  }, [user, activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? It cannot be undone.')) return;
    
    try {
      const { error } = await supabase.from('food_listings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Listing deleted');
      fetchListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.pickup_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Control</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Track, manage and optimize your food redistribution assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 flex items-center gap-2 border-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs uppercase tracking-wider transition-all">
            <FileDown className="w-4 h-4" /> Export Report
          </button>
          <Link to="/create-listing" className="px-5 py-2.5 bg-primary text-white flex items-center gap-2 rounded-xl hover:bg-primary/90 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Add Assets
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border-2 rounded-2xl shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-center gap-6 bg-gray-50/30 dark:bg-gray-900/10">
          <div className="flex space-x-1 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar scroll-smooth">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
             <div className="relative w-full lg:w-80">
               <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search by title or location..." 
                 className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
               />
             </div>
             <button className="p-3 border-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
               <Filter className="w-4 h-4 text-gray-500" />
             </button>
          </div>
        </div>

        {/* Action Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-900/50 uppercase tracking-[0.2em] font-black border-b-2">
              <tr>
                <th className="px-8 py-5">Asset Intelligence</th>
                <th className="px-8 py-5">Quantity</th>
                <th className="px-8 py-5">Operational Status</th>
                <th className="px-8 py-5">Time Remaining</th>
                <th className="px-8 py-5">Interactions</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                         <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Assets...</span>
                      </div>
                   </td>
                </tr>
              ) : filteredListings.length > 0 ? filteredListings.map((listing) => (
                <motion.tr 
                  key={listing.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="bg-white dark:bg-gray-950 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 dark:bg-primary/10 overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm">
                        {listing.images && listing.images.length > 0 ? (
                            <img src={listing.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-black uppercase text-[10px]">Food</div>
                        )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{listing.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {listing.pickup_address}
                            </p>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-lg font-black">{listing.quantity}</span> 
                    <span className="text-[10px] font-bold uppercase text-gray-400 ml-1">{listing.quantity_unit}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                      ${listing.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                      ${listing.status === 'claimed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : ''}
                      ${listing.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                      ${listing.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : ''}
                    `}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {listing.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${new Date(listing.expiry_datetime) < new Date() ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${new Date(listing.expiry_datetime) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                            {new Date(listing.expiry_datetime).toLocaleDateString()}
                        </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1 font-bold text-xs">
                        <span className="text-gray-900 dark:text-gray-100">{listing.claims?.[0]?.count || 0}</span>
                        <span className="text-gray-400 uppercase text-[10px]">Claims</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link 
                            to={`/listings/${listing.id}`}
                            className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group/link"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                        {listing.status === 'available' && (
                            <button 
                                onClick={() => handleDelete(listing.id)}
                                className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400">
                           <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-gray-400">
                         <AlertCircle className="w-12 h-12 opacity-20" />
                         <div className="space-y-1">
                            <p className="font-bold uppercase tracking-widest">No listings found</p>
                            <p className="text-xs">Try adjusting your filters or create a new donation listing.</p>
                         </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-6 border-t-2 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/20">
          Sync Status: Optimized for Real-time
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> DB CONNECTED</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> POLLING INACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
