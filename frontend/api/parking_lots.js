import { API_BASE } from './client';

export async function getParkingLots() {
  const response = await fetch(`${API_BASE}/parking/lots`);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof body?.detail === 'string'
        ? body.detail
        : 'Failed to load parking lots';
    throw new Error(detail);
  }
  return Array.isArray(body) ? body : [];
}