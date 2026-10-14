'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Truck,
  Navigation,
  Globe,
  ExternalLink,
  Layers,
  Compass,
  Clock,
  Sparkles,
  Maximize2
} from 'lucide-react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.8;
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function GoogleLiveTrackingMap({
  driverLat = 24.7932,
  driverLng = 46.6135,
  destLat = 24.7742,
  destLng = 46.6385,
  driverName = 'Tariq K. (Cold-Chain Courier)',
  vehicle = 'Toyota HiAce Chill Van #782',
  customerName = 'Customer',
  destinationAddress = 'Al Malqa, Riyadh',
  orderNumber = 'FM-98421',
  status = 'OUT_FOR_DELIVERY',
  speed = 42,
  temp = '3.5°C',
  height = '420px',
}) {
  const [mapMode, setMapMode] = useState('google'); // 'google' | 'satellite' | 'radar'
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState(null);
  const [customIcons, setCustomIcons] = useState({ driverIcon: null, destIcon: null });

  // Effective coordinates with Riyadh defaults if coordinates are missing
  const validDriverLat = typeof driverLat === 'number' && !isNaN(driverLat) ? driverLat : 24.7932;
  const validDriverLng = typeof driverLng === 'number' && !isNaN(driverLng) ? driverLng : 46.6135;
  const validDestLat = typeof destLat === 'number' && !isNaN(destLat) ? destLat : 24.7742;
  const validDestLng = typeof destLng === 'number' && !isNaN(destLng) ? destLng : 46.6385;

  const distanceKm = calculateDistanceKm(validDriverLat, validDriverLng, validDestLat, validDestLng);
  const estimatedMins = Math.max(5, Math.round((distanceKm / (speed > 0 ? speed : 35)) * 60) + 3);

  // Google Maps Embed URL
  const googleMapEmbedUrl =
    mapMode === 'satellite'
      ? `https://maps.google.com/maps?saddr=${validDriverLat},${validDriverLng}&daddr=${validDestLat},${validDestLng}&t=k&z=14&output=embed`
      : `https://maps.google.com/maps?saddr=${validDriverLat},${validDriverLng}&daddr=${validDestLat},${validDestLng}&z=14&output=embed`;

  // Direct Google Maps External Directions Link (Turn-by-turn navigation)
  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${validDriverLat},${validDriverLng}&destination=${validDestLat},${validDestLng}`;

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Custom Van Icon
      const driverSvg = `
        <div style="background: #043927; width: 40px; height: 40px; border-radius: 9999px; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
      `;
      const driverIcon = leaflet.divIcon({
        className: 'custom-driver-icon',
        html: driverSvg,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Custom Destination Icon
      const destSvg = `
        <div style="background: #e11d48; width: 38px; height: 38px; border-radius: 9999px; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;
      const destIcon = leaflet.divIcon({
        className: 'custom-dest-icon',
        html: destSvg,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      setCustomIcons({ driverIcon, destIcon });
      setL(leaflet);
    });
  }, []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg bg-slate-950 font-sans">
      
      {/* MAP ENGINE CONTAINER */}
      <div style={{ height }} className="relative w-full overflow-hidden">
        {mapMode === 'radar' && mounted && L ? (
          /* LEAFLET RADAR GPS VIEW */
          <MapContainer
            center={[(validDriverLat + validDestLat) / 2, (validDriverLng + validDestLng) / 2]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Dynamic Route Polyline */}
            <Polyline
              positions={[
                [validDriverLat, validDriverLng],
                [validDestLat, validDestLng],
              ]}
              color="#05A764"
              weight={5}
              opacity={0.85}
              dashArray="10, 8"
            />
            {/* Courier Marker */}
            <Marker position={[validDriverLat, validDriverLng]} icon={customIcons.driverIcon || undefined}>
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <strong className="text-emerald-700 block">🚚 Courier Live: {driverName}</strong>
                  <span className="text-slate-600 block">{vehicle}</span>
                  <span className="text-slate-400 text-[10px]">Speed: {speed} km/h • Temp: {temp}</span>
                </div>
              </Popup>
            </Marker>
            {/* Destination Marker */}
            <Marker position={[validDestLat, validDestLng]} icon={customIcons.destIcon || undefined}>
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <strong className="text-rose-600 block">📍 Delivery Destination</strong>
                  <span className="text-slate-700 block font-semibold">{customerName}</span>
                  <span className="text-slate-500 text-[10px]">{destinationAddress}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          /* GOOGLE MAPS INTERACTIVE EMBED */
          <iframe
            key={`${mapMode}-${validDriverLat}-${validDestLat}`}
            src={googleMapEmbedUrl}
            title="Google Maps Live Delivery Tracking"
            className="w-full h-full border-0 filter contrast-105"
            loading="lazy"
            allowFullScreen
          />
        )}

        {/* Floating Top Left Telemetry Tag */}
        <div className="absolute top-4 left-4 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 text-white shadow-xl flex items-center gap-2 text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Google Maps GPS Active</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-400 font-extrabold">{distanceKm} km away</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-[#043927]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>ETA: ~{estimatedMins} Mins</span>
          </div>
        </div>

        {/* Floating Top Right Mode Switcher & Open in Google Maps */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Mode Switcher Pill */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapMode === 'google'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Google Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapMode('radar')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                mapMode === 'radar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>GPS Radar</span>
            </button>
          </div>

          {/* Open Turn-by-Turn in Google Maps App */}
          <a
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-[#05A764] hover:bg-[#048b53] text-white px-3.5 py-2 rounded-2xl text-xs font-black shadow-xl transition-all cursor-pointer"
            title="Open in Google Maps App"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        {/* Bottom Destination Info Pill */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white shadow-xl flex items-center gap-3 text-xs w-full sm:w-auto pointer-events-auto">
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                Delivering to:
              </div>
              <div className="font-extrabold text-slate-100 truncate">
                {destinationAddress}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 text-slate-800 shadow-xl flex items-center gap-2 text-xs font-bold self-end sm:self-auto pointer-events-auto">
            <span className="text-slate-500">Speed: <strong className="text-slate-900">{speed} km/h</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700">Cold-Chain: <strong className="text-emerald-800">{temp}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
