import { API_BASE } from './client';
import { normalizeColorId } from '../utils/carUtils';

function formatError(body, fallback = 'Request failed') {
  const detail = body?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item?.msg ? item.msg : JSON.stringify(item)))
      .join(', ');
  }

  if (typeof body?.message === 'string') {
    return body.message;
  }

  return fallback;
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      formatError(body, `Request failed with status ${response.status}`)
    );
  }

  return body;
}

function jsonHeaders(accessToken) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export function buildVehicleApiBody(car) {
  const colorId = normalizeColorId(
    car?.colorId || car?.color_id || car?.color
  );

  return {
    license_plate: car?.licensePlate || car?.license_plate || '',
    make: car?.make || null,
    model: car?.model || null,
    color: colorId,
    color_id: colorId,
    year: car?.year ? String(car.year).trim() : null,
    title: car?.title || car?.name || car?.make || null,
    image_url: null,
    parked_latitude:
      car?.parkedLocation?.latitude ?? car?.parked_latitude ?? null,
    parked_longitude:
      car?.parkedLocation?.longitude ?? car?.parked_longitude ?? null,
  };
}

export async function getVehicle(vehicleId) {
  const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
    headers: { Accept: 'application/json' },
  });

  return parseResponse(response);
}

export async function getVehiclesForDriver(userId) {
  const response = await fetch(`${API_BASE}/vehicles/${userId}/vehicles`, {
    headers: { Accept: 'application/json' },
  });

  return parseResponse(response);
}

export async function getMyVehicles(accessToken) {
  const response = await fetch(`${API_BASE}/users/me/vehicles`, {
    headers: jsonHeaders(accessToken),
  });

  return parseResponse(response);
}

export async function updateVehicle(accessToken, vehicleId, car) {
  const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(buildVehicleApiBody(car)),
  });

  return parseResponse(response);
}

export async function createMyVehicle(accessToken, vehicle) {
  const response = await fetch(`${API_BASE}/users/me/vehicles`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(buildVehicleApiBody(vehicle)),
  });

  return parseResponse(response);
}
