import { API_BASE } from './client';

function formatError(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(', ');
  }
  if (d && typeof d === 'object') return JSON.stringify(d);
  return 'Request failed';
}

function hasUserPlace(userPlace) {
  if (!userPlace || typeof userPlace !== 'object') return false;
  return ['city', 'region', 'country'].some(
    (k) => typeof userPlace[k] === 'string' && userPlace[k].trim().length > 0
  );
}

export async function sendParkingChat({
  message,
  history = [],
  userPlace = null,
  userLocation = null,
  images = [],
}) {
  const payload = { message, history };

  if (Array.isArray(images) && images.length > 0) {
    payload.images = images
      .filter((image) => image?.base64)
      .map((image) => ({
        mime_type: image.mimeType || 'image/jpeg',
        data: image.base64,
      }));
  }

  if (hasUserPlace(userPlace)) {
    payload.user_place = {};
    if (typeof userPlace.city === 'string' && userPlace.city.trim()) {
      payload.user_place.city = userPlace.city.trim();
    }
    if (typeof userPlace.region === 'string' && userPlace.region.trim()) {
      payload.user_place.region = userPlace.region.trim();
    }
    if (typeof userPlace.country === 'string' && userPlace.country.trim()) {
      payload.user_place.country = userPlace.country.trim();
    }
  } else if (
    userLocation &&
    typeof userLocation.latitude === 'number' &&
    typeof userLocation.longitude === 'number'
  ) {
    payload.user_location = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };
    if (userLocation.accuracy != null && Number.isFinite(userLocation.accuracy)) {
      payload.user_location.accuracy = userLocation.accuracy;
    }
  }

  const res = await fetch(`${API_BASE}/parking-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatError(body));
  }
  return body;
}
