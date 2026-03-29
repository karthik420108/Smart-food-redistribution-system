/**
 * Custom DivIcon factory for volunteer markers.
 * Returns an L.DivIcon with SVG + pulse ring based on volunteer status.
 */
import L from 'leaflet';

type VolunteerStatus = 'available' | 'on_task' | 'break' | 'offline';

const STATUS_COLORS: Record<VolunteerStatus, string> = {
  available: '#34d399',   // emerald-400
  on_task:   '#f59e0b',   // amber-400
  break:     '#60a5fa',   // blue-400
  offline:   '#6b7280',   // gray-500
};

const RING_COLORS: Record<VolunteerStatus, string> = {
  available: 'rgba(52, 211, 153, 0.4)',
  on_task:   'rgba(245, 158, 11, 0.4)',
  break:     'rgba(96, 165, 250, 0.4)',
  offline:   'rgba(107, 114, 128, 0.2)',
};

export function createVolunteerIcon(
  name: string,
  status: VolunteerStatus,
  isActive = false
): L.DivIcon {
  const color = STATUS_COLORS[status] || '#6b7280';
  const ringColor = RING_COLORS[status] || 'transparent';
  const initial = name?.[0]?.toUpperCase() || '?';
  const pulseCss = isActive ? `animation: volunteer-pulse 2s ease-out infinite;` : '';

  const html = `
    <div style="position:relative;width:44px;height:44px;">
      <!-- Pulse ring (active tasks only) -->
      ${isActive ? `
      <div style="
        position:absolute;inset:-8px;border-radius:50%;
        background:${ringColor};
        ${pulseCss}
      "></div>` : ''}
      <!-- Marker body -->
      <div style="
        position:absolute;inset:0;
        border-radius:50%;
        background: linear-gradient(135deg, ${color}dd, ${color}aa);
        border: 2.5px solid ${color};
        box-shadow: 0 4px 14px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.12);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:700;color:#fff;
        font-family: system-ui, sans-serif;
        letter-spacing:-0.5px;
      ">${initial}</div>
      <!-- Status dot -->
      <div style="
        position:absolute;bottom:1px;right:1px;
        width:10px;height:10px;border-radius:50%;
        background:${color};
        border:2px solid #111827;
        box-shadow:0 0 6px ${color};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
    className: '',     // override leaflet's default white background
  });
}

export function createPickupIcon(): L.DivIcon {
  const html = `
    <div style="
      width:32px;height:32px;border-radius:8px;
      background:linear-gradient(135deg,#0d9488,#0f766e);
      border:2px solid rgba(255,255,255,0.2);
      box-shadow:0 4px 12px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
    ">📦</div>
  `;
  return L.divIcon({ html, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18], className: '' });
}

export function createNgoIcon(): L.DivIcon {
  const html = `
    <div style="
      width:36px;height:36px;border-radius:10px;
      background:linear-gradient(135deg,#7c3aed,#6d28d9);
      border:2px solid rgba(255,255,255,0.2);
      box-shadow:0 4px 14px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:20px;
    ">🏛️</div>
  `;
  return L.divIcon({ html, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20], className: '' });
}
