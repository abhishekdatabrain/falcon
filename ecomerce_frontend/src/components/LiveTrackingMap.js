'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet (Client-side rendering only)
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

import 'leaflet/dist/leaflet.css';

export default function LiveTrackingMap({ driverLat, driverLng, destLat, destLng, title = "Delivery Live Location" }) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState(null);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      // Fix default marker icon assets issue in Next.js
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(leaflet);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
        <span className="text-gray-400 font-medium animate-pulse">Loading Live Map Engine...</span>
      </div>
    );
  }

  const centerLat = driverLat || destLat || 24.7136; // Riyadh default lat
  const centerLng = driverLng || destLng || 46.6753; // Riyadh default lng

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden glass-panel border border-white/15 shadow-2xl relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver Marker */}
        {driverLat && driverLng && (
          <Marker position={[driverLat, driverLng]}>
            <Popup>
              <div className="p-1 text-slate-900 font-bold">
                🚚 Driver Location
                <br />
                <span className="text-xs font-normal text-slate-600">
                  Lat: {driverLat.toFixed(5)}, Lng: {driverLng.toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destLat && destLng && (
          <Marker position={[destLat, destLng]}>
            <Popup>
              <div className="p-1 text-slate-900 font-bold">
                📍 Delivery Destination
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000] px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-400 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        {title}
      </div>
    </div>
  );
}
