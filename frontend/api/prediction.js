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
 * GET /api/prediction/live-frame — proxy to the detection service using the
 * garage's actual camera feed + defined spots.
 */
export async function getLiveFramePredictions(params = {}) {
  if (params.lotId == null) {
    throw new Error('lotId is required');
  }
  const qs = new URLSearchParams();
  qs.set('lot_id', String(params.lotId));
  if (params.levelId != null) qs.set('level_id', String(params.levelId));
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
