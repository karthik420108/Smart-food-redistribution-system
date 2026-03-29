import { useEffect, useState } from 'react';
import { useVolunteerStore } from '../../store/volunteerStore';
import { Package, Clock, Star, CheckCircle, Loader2 } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  assigned: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
};

export function VolunteerTasks() {
  const { taskHistory, fetchTaskHistory } = useVolunteerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskHistory().then(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-orange-400" size={28} /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">My Tasks</h1>
        <p className="text-xs text-gray-400 mt-0.5">{taskHistory.length} tasks total</p>
      </div>

      {taskHistory.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <CheckCircle size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taskHistory.map((task: any) => {
            const listing = task.ngo_food_claims?.food_listings;
            return (
              <div key={task.id} className="bg-gray-900 rounded-2xl border border-white/5 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {listing?.images?.[0] ? (
                    <img src={listing.images[0]} className="w-full h-full object-cover rounded-xl" alt="" />
                  ) : '🍱'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{listing?.title || 'Food Pickup'}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Package size={10} />{task.ngo_food_claims?.quantity_claimed} {task.ngo_food_claims?.quantity_unit}
                    <span>·</span>
                    <Clock size={10} />{new Date(task.assigned_at).toLocaleDateString()}
                    {task.actual_kg_collected && <><span>·</span><span>{task.actual_kg_collected}kg</span></>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize whitespace-nowrap ${STATUS_STYLES[task.status] || 'bg-gray-700/50 text-gray-400'}`}>
                  {task.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
