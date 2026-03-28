import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface MockMapProps {
  center?: { lat: number; lng: number };
  markers?: Array<{ lat: number; lng: number; label: string; type: 'donor' | 'receiver' }>;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
}

export function MockMap({ center, markers, className, onClick }: MockMapProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Map percentages back to pseudo-coordinates
    const lng = (x * 3.6) - 180;
    const lat = 90 - (y * 1.8);
    onClick(lat, lng);
  };

  return (
    <div 
      className={`relative bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 cursor-crosshair ${className}`}
      onClick={handleClick}
    >
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />
      
      {/* City-like paths */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 20 H100 M0 50 H100 M0 80 H100 M30 0 V100 M70 0 V100" stroke="currentColor" strokeWidth="0.5" fill="none" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
            <Navigation className="w-8 h-8 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest">Map Intelligence Active</span>
        </div>
      </div>

      {/* Markers */}
      {markers?.map((marker, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="absolute"
          style={{ 
            left: `${((marker.lng + 180) % 360) / 3.6}%`, 
            top: `${(90 - marker.lat) / 1.8}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative group">
            <div className={`p-2 rounded-full shadow-lg ${
                marker.type === 'donor' ? 'bg-primary text-white' : 'bg-amber-500 text-white'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border pointer-events-none">
                 {marker.label}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-gray-800" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Overlay Status */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-2xl">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Live Optimization Ready</span>
         </div>
         <div className="flex gap-2 text-[10px] font-mono text-slate-500">
            <span>{center?.lat.toFixed(4) || '19.0760'}°N</span>
            <span>{center?.lng.toFixed(4) || '72.8777'}°E</span>
         </div>
      </div>
    </div>
  );
}
