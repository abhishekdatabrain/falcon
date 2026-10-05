'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

export default function LiveTrackingMap({
  driverLat,
  driverLng,
  destLat,
  destLng,
  driverName = 'Driver',
  customerName = 'Customer',
  orderNumber = '',
  title = 'Delivery Live Location',
  height = '450px',
}) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState(null);
  const [customIcons, setCustomIcons] = useState({ driverIcon: null, destIcon: null });

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Custom Driver Icon
      const driverSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="36" height="36" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));">
          <circle cx="12" cy="12" r="11" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
          <path fill="#ffffff" d="M18 10.5V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v9.5a1.5 1.5 0 0 0 1.5 1.5h.5a2.5 2.5 0 0 0 5 0h6a2.5 2.5 0 0 0 5 0h.5a1.5 1.5 0 0 0 1.5-1.5v-3.5a1 1 0 0 0-.5-.87l-3-1.63zM6.5 17.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      `;
      const driverIcon = leaflet.divIcon({
        className: 'custom-driver-marker',
        html: driverSvg,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Destination Icon
      const destSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="36" height="36" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));">
          <circle cx="12" cy="12" r="11" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
          <path fill="#ffffff" d="M12 2a8 8 0 0 0-8 8c0 5.25 7.2 11.4 7.52 11.67a.75.75 0 0 0 .96 0C12.8 21.4 20 15.25 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
        </svg>
      `;
      const destIcon = leaflet.divIcon({
        className: 'custom-dest-marker',
        html: destSvg,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      setCustomIcons({ driverIcon, destIcon });
      setL(leaflet);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center"
      >
        <span className="text-cyan-400 font-medium animate-pulse text-sm">
          Loading Interactive Live GPS Map Engine...
        </span>
      </div>
    );
  }

  const validDriverLat = typeof driverLat === 'number' && !isNaN(driverLat) ? driverLat : null;
  const validDriverLng = typeof driverLng === 'number' && !isNaN(driverLng) ? driverLng : null;
  const validDestLat = typeof destLat === 'number' && !isNaN(destLat) ? destLat : null;
  const validDestLng = typeof destLng === 'number' && !isNaN(destLng) ? destLng : null;

  const centerLat = validDriverLat || validDestLat || 24.7136;
  const centerLng = validDriverLng || validDestLng || 46.6753;

  const positions = [];
  if (validDriverLat && validDriverLng) positions.push([validDriverLat, validDriverLng]);
  if (validDestLat && validDestLng) positions.push([validDestLat, validDestLng]);

  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-900"
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Line */}
        {positions.length === 2 && (
          <Polyline
            positions={positions}
            color="#0284c7"
            weight={4}
            opacity={0.8}
            dashArray="8, 8"
          />
        )}

        {/* Driver Marker */}
        {validDriverLat && validDriverLng && (
          <Marker
            position={[validDriverLat, validDriverLng]}
            icon={customIcons.driverIcon || undefined}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-700 text-sm">
                  <span>🚚 Driver Position</span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">{driverName}</p>
                {orderNumber && <p className="text-[11px] text-slate-500">Order #{orderNumber}</p>}
                <p className="text-[10px] text-slate-400 font-mono">
                  {validDriverLat.toFixed(5)}, {validDriverLng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {validDestLat && validDestLng && (
          <Marker
            position={[validDestLat, validDestLng]}
            icon={customIcons.destIcon || undefined}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
                  <span>📍 Customer Location</span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">{customerName}</p>
                {orderNumber && <p className="text-[11px] text-slate-500">Order #{orderNumber}</p>}
                <p className="text-[10px] text-slate-400 font-mono">
                  {validDestLat.toFixed(5)}, {validDestLng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-semibold text-cyan-400 flex items-center gap-2 shadow-md">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span>{title}</span>
      </div>
    </div>
  );
}
