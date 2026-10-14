export interface CityCoordinate {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}

export const INDONESIAN_CITY_COORDINATES: CityCoordinate[] = [
  // Jawa Barat
  { name: 'Kota Bogor', province: 'Jawa Barat', latitude: -6.5971, longitude: 106.8060 },
  { name: 'Kabupaten Bogor', province: 'Jawa Barat', latitude: -6.4800, longitude: 106.8400 },
  { name: 'Kota Depok', province: 'Jawa Barat', latitude: -6.4025, longitude: 106.7942 },
  { name: 'Kota Bandung', province: 'Jawa Barat', latitude: -6.9175, longitude: 107.6191 },
  { name: 'Kota Bekasi', province: 'Jawa Barat', latitude: -6.2383, longitude: 106.9756 },
  { name: 'Kabupaten Bekasi', province: 'Jawa Barat', latitude: -6.2800, longitude: 107.1200 },

  // DKI Jakarta
  { name: 'Jakarta Selatan', province: 'DKI Jakarta', latitude: -6.2615, longitude: 106.8106 },
  { name: 'Jakarta Timur', province: 'DKI Jakarta', latitude: -6.2250, longitude: 106.9004 },
  { name: 'Jakarta Barat', province: 'DKI Jakarta', latitude: -6.1683, longitude: 106.7588 },
  { name: 'Jakarta Pusat', province: 'DKI Jakarta', latitude: -6.1805, longitude: 106.8284 },
  { name: 'Jakarta Utara', province: 'DKI Jakarta', latitude: -6.1384, longitude: 106.8640 },

  // Banten
  { name: 'Kota Tangerang', province: 'Banten', latitude: -6.1783, longitude: 106.6319 },
  { name: 'Kota Tangerang Selatan', province: 'Banten', latitude: -6.2889, longitude: 106.7179 },
  { name: 'Kabupaten Tangerang', province: 'Banten', latitude: -6.2200, longitude: 106.5000 },

  // Jawa Tengah & DIY
  { name: 'Kota Semarang', province: 'Jawa Tengah', latitude: -6.9667, longitude: 110.4167 },
  { name: 'Kota Surakarta (Solo)', province: 'Jawa Tengah', latitude: -7.5755, longitude: 110.8243 },
  { name: 'Kota Yogyakarta', province: 'DI Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
  { name: 'Kabupaten Sleman', province: 'DI Yogyakarta', latitude: -7.7167, longitude: 110.3500 },
  { name: 'Kabupaten Bantul', province: 'DI Yogyakarta', latitude: -7.8833, longitude: 110.3333 },

  // Jawa Timur
  { name: 'Kota Surabaya', province: 'Jawa Timur', latitude: -7.2575, longitude: 112.7521 },
  { name: 'Kota Malang', province: 'Jawa Timur', latitude: -7.9666, longitude: 112.6326 },
  { name: 'Kabupaten Sidoarjo', province: 'Jawa Timur', latitude: -7.4478, longitude: 112.7183 },
];

/**
 * Calculates distance between two GPS coordinates using Haversine formula (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface UserLocationResult {
  latitude: number;
  longitude: number;
  cityName: string;
  provinceName: string;
  districtName?: string;
  displayName: string;
  distanceToCityCenterKm: number;
}

/**
 * Detects device location using HTML5 Geolocation API and matches nearest city
 */
export async function detectUserLocation(): Promise<UserLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser Anda tidak mendukung deteksi lokasi GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // 1. Find nearest city from known coordinates
        let nearestCity = INDONESIAN_CITY_COORDINATES[0];
        let minDistance = calculateDistanceKm(
          lat,
          lon,
          nearestCity.latitude,
          nearestCity.longitude
        );

        for (const city of INDONESIAN_CITY_COORDINATES) {
          const dist = calculateDistanceKm(lat, lon, city.latitude, city.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            nearestCity = city;
          }
        }

        let districtName = '';

        // 2. Try reverse geocoding via OpenStreetMap for sub-district (timeout safe)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            districtName =
              addr.suburb ||
              addr.district ||
              addr.village ||
              addr.municipality ||
              '';
          }
        } catch {
          // Timeout or rate-limited; proceed with mathematical nearest match
        }

        const displayName = districtName
          ? `${districtName}, ${nearestCity.name}`
          : `${nearestCity.name}, ${nearestCity.province}`;

        resolve({
          latitude: lat,
          longitude: lon,
          cityName: nearestCity.name,
          provinceName: nearestCity.province,
          districtName: districtName || undefined,
          displayName,
          distanceToCityCenterKm: minDistance,
        });
      },
      (err) => {
        let msg = 'Gagal mengakses lokasi perangkat.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin akses lokasi ditolak oleh browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia saat ini.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan lokasi habis.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Returns estimated distance from user location to a provider based on provider city
 */
export function getProviderDistance(
  userLat: number,
  userLon: number,
  providerCity: string
): number | null {
  const city = INDONESIAN_CITY_COORDINATES.find(
    (c) => c.name.toLowerCase() === providerCity.toLowerCase()
  );
  if (!city) return null;
  return calculateDistanceKm(userLat, userLon, city.latitude, city.longitude);
}
