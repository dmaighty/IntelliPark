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

export async function sendParkingChat({ message, history = [] }) {
  const res = await fetch(`${API_BASE}/parking-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatError(body));
  }
  return body;
}
