export const API_ORIGIN = 'http://localhost:8000';
export const API_BASE = `${API_ORIGIN}/api`;

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
