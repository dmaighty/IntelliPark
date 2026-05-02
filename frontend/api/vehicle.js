import { API_BASE } from './client';

function formatError(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(', ');
  }
  return 'Request failed';
}

export function buildVehicleApiBody(car) {
  return {
    license_plate: car.licensePlate,
    make: car.make || null,
    model: null,
    color: car.color || null,
    year: car.year || null,
    title: car.title || car.make || null,
    color_id: car.colorId || null,
    image_url: null,
    parked_latitude: car.parkedLocation?.latitude ?? null,
    parked_longitude: car.parkedLocation?.longitude ?? null,
  };
}

export async function getVehicle(vehicleId) {
  const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`);
  return response.json();
}

export async function getVehiclesForDriver(userId) {
  const response = await fetch(`${API_BASE}/vehicles/${userId}/vehicles`);
  return response.json();
}

export async function getMyVehicles(accessToken) {
  const response = await fetch(`${API_BASE}/users/me/vehicles`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function updateVehicle(accessToken, vehicleId, car) {
  const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(buildVehicleApiBody(car)),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(formatError(body));
  }
  return body;
}

export async function createVehicle(vehicle) {
  const response = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    body: JSON.stringify(vehicle),
  });
  return response.json();
}

export async function createMyVehicle(accessToken, vehicle) {
  const response = await fetch(`${API_BASE}/users/me/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(buildVehicleApiBody(vehicle)),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(formatError(body));
  }
  return body;
}
