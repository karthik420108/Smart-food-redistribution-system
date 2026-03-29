import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Plus, Zap, Activity, Package, 
  Trophy, Target, User, ChevronRight, Globe, Lock, Cpu
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';

// --- NEW COMPONENT: REVOLVING BORDER ---
const RevolvingBorder = () => (
  <svg
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    <rect
      x="0"
      y="0"
      width="100%"
      height="100%"
      rx="28" // Matches card border-radius
      fill="none"
      stroke="#10b981"
      strokeWidth="3"
      strokeDasharray="100 300" // Length of the rail vs gap
      style={{
        transition: 'opacity 0.3s ease',
      }}
    >
      <animate
        attributeName="stroke-dashoffset"
        from="400"
        to="0"
        dur="2s"
        repeatCount="indefinite"
      />
    </rect>
  </svg>
);

export function DashboardOverview() {
  const { isDark } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null); // Track hover state
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { 
      center: [19.076, 72.877], zoom: 12, zoomControl: false, attributionControl: false 
    });
    L.tileLayer(isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    ).addTo(mapInstance.current);
    
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [isDark]);

  const containerVars = { visible: { transition: { staggerChildren: 0.05 } } };
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative', minHeight: '100vh',
        backgroundColor: isDark ? '#020617' : '#f8fafc',
        overflowX: 'hidden', fontFamily: '"Inter", sans-serif',
        color: isDark ? '#f1f5f9' : '#1e293b',
        boxSizing: 'border-box',
        transition: 'background-color 0.5s ease'
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .card-perspective { perspective: 2000px; height: 100%; }
        
        .professional-card {
          width: 100%; height: 100%;
          background: ${isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)'};
          border-radius: 28px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          position: relative;
        }

        .professional-card:hover {
          transform: translateY(-5px);
          border-color: transparent; /* Hide static border on hover */
          box-shadow: ${isDark ? '0 20px 40px -12px rgba(16, 185, 129, 0.15)' : '0 20px 40px -12px rgba(0, 0, 0, 0.1)'};
        }

        .card-inner {
          padding: 28px; height: 100%; width: 100%;
          display: flex; flex-direction: column; justify-content: space-between;
          background: ${isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.4)'};
          backdrop-filter: blur(8px);
        }

        .icon-box {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: ${isDark ? '#1e293b' : '#ffffff'};
          color: #10b981;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .leaflet-container { width: 100%; height: 100%; filter: ${isDark ? 'hue-rotate(140deg) brightness(0.8)' : 'none'}; }
        
        .glass-header {
          background: ${isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
          backdrop-filter: blur(20px);
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          padding: 24px 40px;
          border-radius: 24px;
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 40px;
        }
      `}</style>

      {/* NEW HUD GRID BACKGROUND */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#1e293b' : '#e2e8f0'} 1px, transparent 0)`,
        backgroundSize: '48px 48px',
        maskImage: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        zIndex: 0
      }} />

      <motion.div 
        variants={containerVars} initial="hidden" animate="visible"
        style={{ position: 'relative', zIndex: 1, padding: '40px', maxWidth: '1500px', margin: '0 auto' }}
      >
        <motion.div variants={itemVars} className="glass-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Cpu size={14} color="#10b981" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                System: 0x294_Operational
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: isDark ? '#fff' : '#0f172a', margin: 0 }}>
              Command <span style={{ color: '#10b981' }}>Center</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
             <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               style={{ 
                 backgroundColor: '#10b981', color: 'white', padding: '14px 24px', borderRadius: '14px', 
                 border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' 
               }}
             >
               <Plus size={18} strokeWidth={3} /> NEW LOGISTICS
             </motion.button>
          </div>
        </motion.div>

        {/* METRICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Asset Payload', val: '2,480kg', icon: Package, id: 'stat-1' },
            { label: 'Sync Rate', val: '98.2%', icon: Zap, id: 'stat-2' },
            { label: 'Active Nodes', val: '42', icon: Activity, id: 'stat-3' },
            { label: 'Global Rank', val: '#12', icon: Trophy, id: 'stat-4' }
          ].map((stat) => (
            <motion.div 
              key={stat.id} 
              variants={itemVars} 
              className="card-perspective"
              onMouseEnter={() => setHoveredIndex(stat.id)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="professional-card">
                {hoveredIndex === stat.id && <RevolvingBorder />}
                <div className="card-inner">
                   <div className="icon-box"><stat.icon size={20} /></div>
                   <div>
                     <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{stat.label}</div>
                     <div style={{ fontSize: '24px', fontWeight: 900 }}>{stat.val}</div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MAIN HUD SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '620px' }}>
          <motion.div variants={itemVars} className="professional-card" style={{ border: 'none' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <div ref={mapRef} />
            </div>
            <div style={{
              position: 'absolute', top: '20px', left: '20px', zIndex: 1000,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'white',
              padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
              border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Fleet Telemetry</span>
            </div>
          </motion.div>

          <motion.div variants={itemVars} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div 
              className="card-perspective" 
              style={{ flex: 1.2 }}
              onMouseEnter={() => setHoveredIndex('agent')}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="professional-card">
                {hoveredIndex === 'agent' && <RevolvingBorder />}
                <div className="card-inner" style={{ background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #020617 100%)' : '#fff' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>Active Pickups</h3>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>VERIFICATION PENDING</p>
                  </div>
                  <div style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', 
                    padding: '20px', borderRadius: '18px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#10b981', padding: '10px', borderRadius: '10px', color: 'white' }}><User size={18} /></div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>Agent 07</div>
                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>READY</div>
                      </div>
                    </div>
                    <motion.button 
                      onClick={() => setVerifyingPin(true)}
                      whileHover={{ x: 3, backgroundColor: '#10b981' }}
                      style={{ background: isDark ? '#334155' : '#e2e8f0', border: 'none', color: isDark ? 'white' : '#1e293b', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronRight size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="card-perspective" 
              style={{ flex: 1 }}
              onMouseEnter={() => setHoveredIndex('chart')}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="professional-card">
                {hoveredIndex === 'chart' && <RevolvingBorder />}
                <div className="card-inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Throughput</h3>
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                    {[30, 50, 40, 90, 60, 80, 55, 70].map((h, i) => (
                      <div key={i} style={{ flex: 1, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '3px', height: '100%', position: 'relative' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 1 }} style={{ position: 'absolute', bottom: 0, width: '100%', background: 'linear-gradient(to top, #10b981, #3b82f6)', borderRadius: '3px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {verifyingPin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ backgroundColor: isDark ? '#0f172a' : 'white', padding: '40px', borderRadius: '32px', textAlign: 'center', maxWidth: '380px', width: '90%', border: isDark ? '1px solid #1e293b' : 'none' }}
            >
               <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
                  <Lock size={28} />
               </div>
               <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px' }}>Access Key</h2>
               <div style={{ 
                 backgroundColor: isDark ? '#020617' : '#f8fafc', padding: '24px', borderRadius: '20px', 
                 fontSize: '48px', fontWeight: 900, color: '#10b981', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, 
                 marginBottom: '32px', letterSpacing: '0.2em' 
               }}>8291</div>
               <button onClick={() => setVerifyingPin(false)} style={{ width: '100%', backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>AUTHENTICATE</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}