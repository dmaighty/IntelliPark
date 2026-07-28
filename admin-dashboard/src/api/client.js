const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

function formatError(body) {
  const d = body?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(", ");
  }
  if (d && typeof d === "object") return JSON.stringify(d);
  return "Request failed";
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatError(data));
  }
  return data;
}

export function login(identifier, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { identifier, password },
  });
}

export function listLots(token) {
  return apiRequest("/admin/lots", { token });
}

export function getLot(token, lotId) {
  return apiRequest(`/admin/lots/${lotId}`, { token });
}

export function createLot(token, body) {
  return apiRequest("/admin/lots", { method: "POST", body, token });
}

export function updateLot(token, lotId, body) {
  return apiRequest(`/admin/lots/${lotId}`, { method: "PATCH", body, token });
}

export function createLevel(token, lotId, body) {
  return apiRequest(`/admin/lots/${lotId}/levels`, {
    method: "POST",
    body,
    token,
  });
}

export function updateLevel(token, levelId, body) {
  return apiRequest(`/admin/levels/${levelId}`, {
    method: "PATCH",
    body,
    token,
  });
}

export function getLevel(token, levelId) {
  return apiRequest(`/admin/levels/${levelId}`, { token });
}

export function putDefinedSpots(token, levelId, spots) {
  return apiRequest(`/admin/levels/${levelId}/spots`, {
    method: "PUT",
    body: { spots },
    token,
  });
}
