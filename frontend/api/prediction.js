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

/**
 * GET /api/prediction/live-frame — proxy to detection service (hardcoded camera on backend).
 */
export async function getLiveFramePredictions(params = {}) {
  const qs = new URLSearchParams();
  if (params.conf != null) qs.set('conf', String(params.conf));
  if (params.imgsz != null) qs.set('imgsz', String(params.imgsz));
  const q = qs.toString();
  const url = `${API_BASE}/prediction/live-frame${q ? `?${q}` : ''}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatError(body));
  }
  return body;
}
