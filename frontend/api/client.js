const API_BASE = 'http://localhost:8000';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
