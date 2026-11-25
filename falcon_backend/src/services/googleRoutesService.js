const logger = require('../utils/logger');

// In-memory cache for Route/ETA computations (TTL = 20 seconds)
const routeCache = new Map();
const CACHE_TTL_MS = 20 * 1000;

/**
 * Calculate Haversine direct distance in meters between two coordinates
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in meters
}

/**
 * Fallback calculation when Google API key is missing or network/quota error occurs
 */
function computeFallbackRoute(origin, destination) {
  const straightLineMeters = calculateHaversineDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  // Urban road factor: street network is typically ~1.35x longer than straight-line distance
  const roadDistanceMeters = Math.round(straightLineMeters * 1.35);

  // Average city driving speed ~30 km/h = 8.33 m/s
  const speedMetersPerSecond = 8.33;
  const durationSeconds = Math.max(60, Math.round(roadDistanceMeters / speedMetersPerSecond));
  const etaMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
  const distanceKm = parseFloat((roadDistanceMeters / 1000).toFixed(1));

  return {
    distance_meters: roadDistanceMeters,
    distance_km: distanceKm,
    distance_text: `${distanceKm} km`,
    duration_seconds: durationSeconds,
    eta_minutes: etaMinutes,
    polyline: null,
    is_fallback: true,
  };
}

class GoogleRoutesService {
  /**
   * Get Route, distance and ETA between Driver origin and Customer destination
   * @param {Object} origin - { latitude, longitude }
   * @param {Object} destination - { latitude, longitude }
   * @param {string} [cacheKey] - Optional identifier (e.g. orderId) to leverage 20s caching
   */
  async computeRouteAndEta(origin, destination, cacheKey = null) {
    if (!origin || !destination) return null;

    const origLat = parseFloat(origin.latitude);
    const origLng = parseFloat(origin.longitude);
    const destLat = parseFloat(destination.latitude);
    const destLng = parseFloat(destination.longitude);

    if (isNaN(origLat) || isNaN(origLng) || isNaN(destLat) || isNaN(destLng)) {
      return null;
    }

    // Check cache
    const key = cacheKey || `${origLat.toFixed(4)},${origLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
    const now = Date.now();
    if (routeCache.has(key)) {
      const cached = routeCache.get(key);
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_ROUTES_API_KEY;

    if (!apiKey) {
      const fallback = computeFallbackRoute(origin, destination);
      routeCache.set(key, { timestamp: now, data: fallback });
      return fallback;
    }

    try {
      // 1. Attempt Google Routes API (Directions v2)
      const routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: origLat,
              longitude: origLng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destLat,
              longitude: destLng,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: true,
        },
        languageCode: 'en-US',
        units: 'METRIC',
      };

      const response = await fetch(routesApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const json = await response.json();
        const primaryRoute = json.routes && json.routes[0];

        if (primaryRoute) {
          const distanceMeters = primaryRoute.distanceMeters || 0;
          const durationStr = primaryRoute.duration || '0s'; // Format: "1234s"
          const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 60;
          const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
          const etaMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

          const result = {
            distance_meters: distanceMeters,
            distance_km: distanceKm,
            distance_text: `${distanceKm} km`,
            duration_seconds: durationSeconds,
            eta_minutes: etaMinutes,
            polyline: primaryRoute.polyline?.encodedPolyline || null,
            is_fallback: false,
          };

          routeCache.set(key, { timestamp: now, data: result });
          return result;
        }
      }

      // 2. Fallback to Google Directions API v1 if v2 returned non-ok
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origLat},${origLng}&destination=${destLat},${destLng}&mode=driving&departure_time=now&key=${apiKey}`;
      const dirRes = await fetch(directionsUrl);
      if (dirRes.ok) {
        const dirJson = await dirRes.json();
        if (dirJson.status === 'OK' && dirJson.routes && dirJson.routes[0]) {
          const leg = dirJson.routes[0].legs[0];
          const distanceMeters = leg.distance ? leg.distance.value : 0;
          const durationSeconds = leg.duration_in_traffic ? leg.duration_in_traffic.value : (leg.duration ? leg.duration.value : 60);
          const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
          const etaMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

          const result = {
            distance_meters: distanceMeters,
            distance_km: distanceKm,
            distance_text: leg.distance?.text || `${distanceKm} km`,
            duration_seconds: durationSeconds,
            eta_minutes: etaMinutes,
            polyline: dirJson.routes[0].overview_polyline?.points || null,
            is_fallback: false,
          };

          routeCache.set(key, { timestamp: now, data: result });
          return result;
        }
      }

      // If Google APIs failed due to quota/network, use fallback
      const fallback = computeFallbackRoute(origin, destination);
      routeCache.set(key, { timestamp: now, data: fallback });
      return fallback;
    } catch (err) {
      logger.warn(`Google Routes calculation notice: ${err.message}. Using Haversine route fallback.`);
      const fallback = computeFallbackRoute(origin, destination);
      routeCache.set(key, { timestamp: now, data: fallback });
      return fallback;
    }
  }
}

module.exports = new GoogleRoutesService();
