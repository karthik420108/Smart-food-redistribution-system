import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, MapPin, Clock, Truck, Package, Phone,
  ChevronRight, Layers, RefreshCw, X, Users, ZoomIn, ZoomOut,
  Crosshair, AlertCircle, CheckCircle, Radio
} from 'lucide-react';
import { useNgoStore } from '../../store/ngoStore';
import { supabase } from '../../lib/supabase';
import { useLeafletFix } from '../../hooks/useLeafletFix';
import { createVolunteerIcon, createPickupIcon, createNgoIcon } from '../../lib/mapIcons';

// ─── OSM tile layer URLs ────────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
    label: 'Dark',
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'Standard',
  },
  humanitarian: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://www.hotosm.org/">HOT</a>',
    label: 'Humanitarian',
  },
};

type TileLayerKey = keyof typeof TILE_LAYERS;

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_ORDER: Record<string, number> = {
  on_task: 0, available: 1, break: 2, offline: 3,
};

const STATUS_BADGE_CLS: Record<string, string> = {
  available:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  on_task:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  break:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  offline:    'bg-gray-700/60 text-gray-500 border-gray-600/30',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  assigned:           'Task assigned',
  accepted:           'Accepted task',
  en_route_pickup:    'En route to pickup',
  arrived_at_pickup:  'At donor location',
  otp_verified:       'OTP verified',
  picked_up:          'Food picked up',
  en_route_delivery:  'Delivering to NGO',
  delivered:          'Delivered',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface VolunteerMarkerState {
  marker: L.Marker;
  routeLine?: L.Polyline;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function LiveTracking() {
  useLeafletFix();

  const { ngo, volunteers, activeTasks, fetchVolunteers, fetchActiveTasks, fetchNgo } = useNgoStore();
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const tileLayer   = useRef<L.TileLayer | null>(null);
  const markerMap   = useRef<Map<string, VolunteerMarkerState>>(new Map());
  const ngoMarker   = useRef<L.Marker | null>(null);

  const [selectedTile, setSelectedTile]       = useState<TileLayerKey>('dark');
  const [selectedVolId, setSelectedVolId]     = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [lastRefreshed, setLastRefreshed]     = useState(new Date());
  const [totalPings, setTotalPings]           = useState(0);

  // ── derived data ─────────────────────────────────────────────────────────
  const sortedVols = [...volunteers].sort(
    (a, b) => (STATUS_ORDER[a.availability_status] ?? 9) - (STATUS_ORDER[b.availability_status] ?? 9)
  );
  const selectedVol  = volunteers.find(v => v.id === selectedVolId) ?? null;
  const selectedTask = activeTasks.find(t => (t.volunteer as any)?.id === selectedVolId) ?? null;

  // ── Initialize Leaflet map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: L.LatLngTuple = [
      ngo?.primary_lat  ?? 12.9716,
      ngo?.primary_lng  ?? 77.5946,
    ];

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,  // we add custom controls below
      attributionControl: true,
    });

    // Tile layer
    const tile = L.tileLayer(TILE_LAYERS[selectedTile].url, {
      attribution: TILE_LAYERS[selectedTile].attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayer.current   = tile;
    mapInstance.current = map;

    // Custom zoom controls (top-right)
    L.control.zoom({ position: 'topright' }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);                       // run once

  // ── NGO base marker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !ngo?.primary_lat) return;
    if (ngoMarker.current) ngoMarker.current.remove();

    ngoMarker.current = L.marker(
      [ngo.primary_lat, ngo.primary_lng],
      { icon: createNgoIcon() }
    )
      .bindPopup(ngoPopupHtml(ngo))
      .addTo(mapInstance.current);
  }, [ngo?.primary_lat, ngo?.primary_lng]);

  // ── Volunteer markers (create / update / remove) ─────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const seen = new Set<string>();

    volunteers.forEach(vol => {
      if (!vol.current_lat || !vol.current_lng) return;
      seen.add(vol.id);

      const latlng: L.LatLngTuple = [vol.current_lat, vol.current_lng];
      const onTask = vol.availability_status === 'on_task';
      const icon   = createVolunteerIcon(vol.full_name, vol.availability_status as any, onTask);

      const existing = markerMap.current.get(vol.id);

      if (existing) {
        // Smooth move: animate via short transition
        existing.marker.setLatLng(latlng);
        existing.marker.setIcon(icon);
        existing.marker.setPopupContent(volPopupHtml(vol));
      } else {
        // First time — create marker
        const marker = L.marker(latlng, { icon })
          .bindPopup(volPopupHtml(vol), { maxWidth: 260, className: '' })
          .addTo(map);

        marker.on('click', () => setSelectedVolId(vol.id));
        markerMap.current.set(vol.id, { marker });
      }

      // Draw a dotted trailing path (pickup → delivery)
      const task = activeTasks.find(t => (t.volunteer as any)?.id === vol.id);
      if (task && onTask) {
        drawRouteLine(vol, task);
      }
    });

    // Remove stale markers
    markerMap.current.forEach((state, id) => {
      if (!seen.has(id)) {
        state.marker.remove();
        state.routeLine?.remove();
        markerMap.current.delete(id);
      }
    });
  }, [volunteers, activeTasks]);

  // ── Tile layer switch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !tileLayer.current) return;
    tileLayer.current.setUrl(TILE_LAYERS[selectedTile].url);
  }, [selectedTile]);

  // ── Real-time: Supabase Realtime + polling ───────────────────────────────
  useEffect(() => {
    fetchNgo();
    fetchVolunteers();
    fetchActiveTasks();

    // 15-second polling fallback
    const pollId = setInterval(() => {
      fetchVolunteers();
      fetchActiveTasks();
      setLastRefreshed(new Date());
      setTotalPings(p => p + 1);
    }, 15_000);

    // Supabase Realtime subscription
    const channel = supabase
      .channel('live-tracking')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ngo_volunteers' },
        () => { fetchVolunteers(); setLastRefreshed(new Date()); setTotalPings(p => p + 1); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'volunteer_tasks' },
        () => fetchActiveTasks()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'volunteer_location_logs' },
        (payload) => {
          // Instantly update marker position from the realtime event
          const { volunteer_id, lat, lng } = payload.new as any;
          const state = markerMap.current.get(volunteer_id);
          if (state && mapInstance.current) {
            state.marker.setLatLng([lat, lng]);
          }
          setTotalPings(p => p + 1);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Draw route lines ─────────────────────────────────────────────────────
  const drawRouteLine = useCallback((vol: any, task: any) => {
    const state = markerMap.current.get(vol.id);
    if (!state || !mapInstance.current) return;

    const points: L.LatLngTuple[] = [];

    // Volunteer current → pickup point
    if (vol.current_lat && task.pickup_lat) {
      points.push([vol.current_lat, vol.current_lng]);
      points.push([task.pickup_lat, task.pickup_lng]);
    }

    // Pickup → delivery (NGO)
    if (task.pickup_lat && task.delivery_lat) {
      if (points.length === 0) points.push([task.pickup_lat, task.pickup_lng]);
      points.push([task.delivery_lat, task.delivery_lng]);
    }

    if (points.length < 2) return;

    state.routeLine?.remove();
    state.routeLine = L.polyline(points, {
      color: '#f59e0b',
      weight: 2.5,
      opacity: 0.7,
      dashArray: '6 4',
      className: 'route-line',
    }).addTo(mapInstance.current);

    // Add pickup marker
    L.marker([task.pickup_lat, task.pickup_lng], { icon: createPickupIcon() })
      .addTo(mapInstance.current)
      .bindPopup(`<div style="padding:8px 12px;font-size:12px;color:#9ca3af;">📦 Pickup point</div>`);

    markerMap.current.set(vol.id, state);
  }, []);

  // ── Pan to selected volunteer ─────────────────────────────────────────────
  const focusVolunteer = useCallback((volId: string) => {
    const vol   = volunteers.find(v => v.id === volId);
    const state = markerMap.current.get(volId);
    if (vol?.current_lat && mapInstance.current && state) {
      mapInstance.current.flyTo([vol.current_lat, vol.current_lng], 16, { duration: 1.2 });
      state.marker.openPopup();
      setSelectedVolId(volId);
    }
  }, [volunteers]);

  // ── Fit all volunteer markers ─────────────────────────────────────────────
  const fitAll = () => {
    if (!mapInstance.current) return;
    const vols = volunteers.filter(v => v.current_lat);
    if (vols.length === 0) return;
    const bounds = L.latLngBounds(vols.map(v => [v.current_lat!, v.current_lng!] as L.LatLngTuple));
    if (ngo?.primary_lat) bounds.extend([ngo.primary_lat, ngo.primary_lng]);
    mapInstance.current.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 1 });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const onTaskCount    = volunteers.filter(v => v.availability_status === 'on_task').length;
  const availableCount = volunteers.filter(v => v.availability_status === 'available').length;
  const offlineCount   = volunteers.filter(v => v.availability_status === 'offline' || v.availability_status === 'break').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden relative">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="w-80 flex-shrink-0 bg-gray-900/95 backdrop-blur border-r border-white/5 flex flex-col z-10 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <Radio size={16} className="text-teal-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <span className="text-sm font-semibold text-white">Live Tracking</span>
                <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-600 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/10 rounded-xl p-2.5 text-center border border-amber-500/20">
                  <div className="text-lg font-bold text-amber-400">{onTaskCount}</div>
                  <div className="text-xs text-gray-500">On Task</div>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center border border-emerald-500/20">
                  <div className="text-lg font-bold text-emerald-400">{availableCount}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-2.5 text-center border border-white/5">
                  <div className="text-lg font-bold text-gray-400">{offlineCount}</div>
                  <div className="text-xs text-gray-500">Offline</div>
                </div>
              </div>

              {/* Ping counter */}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                {totalPings} location updates · last {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>

            {/* Volunteer list */}
            <div className="flex-1 overflow-y-auto">
              {sortedVols.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Users size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">No volunteers yet</p>
                </div>
              ) : (
                sortedVols.map(vol => {
                  const task = activeTasks.find(t => (t.volunteer as any)?.id === vol.id);
                  const isSelected = selectedVolId === vol.id;
                  const hasLocation = !!vol.current_lat;

                  return (
                    <button
                      key={vol.id}
                      onClick={() => hasLocation ? focusVolunteer(vol.id) : setSelectedVolId(vol.id)}
                      className={`w-full flex items-start gap-3 p-4 border-b border-white/5 text-left transition-all ${
                        isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          vol.availability_status === 'on_task' ? 'bg-amber-600/60' :
                          vol.availability_status === 'available' ? 'bg-emerald-600/60' :
                          'bg-gray-700'
                        }`}>
                          {vol.full_name[0]}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                          vol.availability_status === 'available' ? 'bg-emerald-400' :
                          vol.availability_status === 'on_task' ? 'bg-amber-400' :
                          vol.availability_status === 'break' ? 'bg-blue-400' : 'bg-gray-600'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white truncate">{vol.full_name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium capitalize ml-2 flex-shrink-0 ${
                            STATUS_BADGE_CLS[vol.availability_status] || ''
                          }`}>
                            {vol.availability_status.replace('_', ' ')}
                          </span>
                        </div>

                        {task && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                              <Package size={9} />
                              {(task.ngo_food_claims as any)?.food_listings?.title || 'Pickup'}
                            </div>
                            <div className="text-xs text-amber-400 flex items-center gap-1">
                              <Truck size={9} />
                              {TASK_STATUS_LABEL[task.status] || task.status}
                            </div>
                          </div>
                        )}

                        {/* Location badge */}
                        {hasLocation ? (
                          <div className="text-xs text-teal-400 mt-1 flex items-center gap-1">
                            <MapPin size={9} /> GPS live · {vol.current_lat!.toFixed(4)}, {vol.current_lng!.toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={9} /> No GPS yet
                          </div>
                        )}
                      </div>

                      {isSelected && hasLocation && (
                        <ChevronRight size={12} className="text-teal-400 flex-shrink-0 self-center" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected volunteer detail panel */}
            <AnimatePresence>
              {selectedVol && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden flex-shrink-0"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Volunteer Details</span>
                      <button onClick={() => setSelectedVolId(null)} className="text-gray-600 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-gray-800/60">
                        <div className="text-gray-500 mb-0.5">Phone</div>
                        <div className="text-white">{selectedVol.phone}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-800/60">
                        <div className="text-gray-500 mb-0.5">Vehicle</div>
                        <div className="text-white capitalize">{selectedVol.vehicle_type || '—'}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-800/60">
                        <div className="text-gray-500 mb-0.5">Tasks Done</div>
                        <div className="text-white">{selectedVol.total_tasks_completed}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-800/60">
                        <div className="text-gray-500 mb-0.5">Rating</div>
                        <div className="text-yellow-400">★ {selectedVol.rating?.toFixed(1)}</div>
                      </div>
                    </div>

                    {selectedTask && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                        <div className="text-xs font-semibold text-amber-400">Active Task</div>
                        <div className="text-xs text-white truncate">{(selectedTask.ngo_food_claims as any)?.food_listings?.title}</div>
                        <div className="text-xs text-amber-300">{TASK_STATUS_LABEL[selectedTask.status]}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Package size={9} />
                          {(selectedTask.ngo_food_claims as any)?.quantity_claimed} {(selectedTask.ngo_food_claims as any)?.quantity_unit}
                        </div>
                      </div>
                    )}

                    <a
                      href={selectedVol.current_lat ? `https://www.openstreetmap.org/?mlat=${selectedVol.current_lat}&mlon=${selectedVol.current_lng}#map=16/${selectedVol.current_lat}/${selectedVol.current_lng}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-teal-600/20 text-teal-400 text-xs font-medium border border-teal-500/20 hover:bg-teal-600/30"
                    >
                      <Navigation size={12} /> Open in OSM
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Map container */}
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* ── Floating Controls ── */}
        {/* Sidebar toggle */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur rounded-xl border border-white/10 text-sm text-white hover:bg-gray-800 transition-all shadow-xl"
          >
            <Users size={14} className="text-teal-400" />
            <span>{volunteers.length} volunteers</span>
            {onTaskCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        )}

        {/* Top-right overlay controls */}
        <div className="absolute top-4 right-14 z-[1000] flex flex-col gap-2">
          {/* Fit all */}
          <button
            onClick={fitAll}
            title="Fit all volunteers"
            className="w-9 h-9 bg-gray-900/90 backdrop-blur rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 shadow-lg transition-all"
          >
            <Crosshair size={15} />
          </button>

          {/* Refresh */}
          <button
            onClick={() => { fetchVolunteers(); fetchActiveTasks(); setLastRefreshed(new Date()); }}
            title="Refresh"
            className="w-9 h-9 bg-gray-900/90 backdrop-blur rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 shadow-lg transition-all"
          >
            <RefreshCw size={14} />
          </button>

          {/* Tile picker */}
          <div className="relative group">
            <button
              title="Map style"
              className="w-9 h-9 bg-gray-900/90 backdrop-blur rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 shadow-lg transition-all"
            >
              <Layers size={15} />
            </button>
            <div className="absolute right-11 top-0 hidden group-hover:flex flex-col gap-1 bg-gray-900/95 backdrop-blur border border-white/10 rounded-xl p-2 shadow-2xl w-36">
              {(Object.keys(TILE_LAYERS) as TileLayerKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedTile(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                    selectedTile === key
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {selectedTile === key && <CheckCircle size={10} />}
                  {TILE_LAYERS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="absolute bottom-6 left-4 z-[1000] bg-gray-900/90 backdrop-blur rounded-2xl border border-white/10 p-3 shadow-2xl min-w-[160px]">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Legend</div>
          <div className="space-y-1.5">
            {[
              { color: '#34d399', label: 'Available' },
              { color: '#f59e0b', label: 'On Task' },
              { color: '#60a5fa', label: 'On Break' },
              { color: '#6b7280', label: 'Offline' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
              <span className="text-lg">🏛️</span>
              <span className="text-xs text-gray-400">NGO Base</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="text-xs text-gray-400">Pickup Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-px border-t-2 border-amber-400 border-dashed opacity-70" />
              <span className="text-xs text-gray-400">Route</span>
            </div>
          </div>
        </div>

        {/* ── "No location" banner ── */}
        {volunteers.length > 0 && volunteers.every(v => !v.current_lat) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur border border-amber-500/30 rounded-xl px-4 py-2.5 shadow-xl">
              <AlertCircle size={14} className="text-amber-400" />
              <span className="text-xs text-amber-300">Volunteers haven't shared their location yet</span>
            </div>
          </div>
        )}

        {/* ── Live ping stat (bottom right) ── */}
        <div className="absolute bottom-6 right-4 z-[1000] bg-gray-900/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Live via OpenStreetMap
            {totalPings > 0 && <span className="text-gray-600">· {totalPings} pings</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Popup HTML helpers ───────────────────────────────────────────────────────
function volPopupHtml(vol: any): string {
  const statusColor = vol.availability_status === 'available' ? '#34d399' : vol.availability_status === 'on_task' ? '#f59e0b' : '#6b7280';
  return `
    <div style="padding:14px 16px;min-width:200px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,${statusColor}cc,${statusColor}66);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;border:2px solid ${statusColor};">${vol.full_name[0]}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#fff;">${vol.full_name}</div>
          <div style="font-size:11px;color:${statusColor};text-transform:capitalize;margin-top:1px;">${vol.availability_status.replace('_',' ')}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#6b7280;line-height:1.6;">
        <div>📞 ${vol.phone}</div>
        <div>🚗 ${vol.vehicle_type || '—'}</div>
        <div>✅ ${vol.total_tasks_completed} tasks · ★ ${vol.rating?.toFixed(1)}</div>
        ${vol.current_lat ? `<div style="color:#0d9488;margin-top:4px;">📍 ${vol.current_lat.toFixed(5)}, ${vol.current_lng.toFixed(5)}</div>` : ''}
      </div>
    </div>
  `;
}

function ngoPopupHtml(ngo: any): string {
  return `
    <div style="padding:14px 16px;min-width:200px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:24px;">🏛️</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:#fff;">${ngo.org_name}</div>
          <div style="font-size:11px;color:#7c3aed;margin-top:1px;">${ngo.org_type}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#6b7280;">
        <div>📍 ${ngo.primary_address}</div>
        <div style="margin-top:4px;color:#0d9488;">Food redistribution base</div>
      </div>
    </div>
  `;
}
