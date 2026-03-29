/**
 * Leaflet's default marker icons break when bundled with Vite because the
 * webpack/vite asset pipeline moves the PNGs. This hook patches the icon URLs
 * once at startup so all L.marker() calls work without extra config.
 */
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export function useLeafletFix() {
  // Patch only once
  const proto = L.Icon.Default.prototype as any;
  if (!proto._urlPatched) {
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });
    proto._urlPatched = true;
  }
}
