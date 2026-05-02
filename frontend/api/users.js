import { API_BASE } from './client';
import { getMockUser, isDevMockToken } from './devAuth';

function formatError(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(', ');
  }
  return 'Request failed';
}

export async function getUser(userId) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && userId === 0) {
    return getMockUser();
  }
  const response = await fetch(`${API_BASE}/users/${userId}`);
  return response.json();
}

export async function getMyProfile(accessToken) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && isDevMockToken(accessToken)) {
    return getMockUser();
  }
  const response = await fetch(`${API_BASE}/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function updateMyProfile(accessToken, updates) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && isDevMockToken(accessToken)) {
    const base = getMockUser();
    return {
      ...base,
      ...(updates.full_name != null ? { full_name: updates.full_name } : {}),
      ...(updates.email != null ? { email: String(updates.email) } : {}),
      ...(updates.phone != null ? { phone: updates.phone } : {}),
    };
  }
  const response = await fetch(`${API_BASE}/users/me/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(formatError(body));
  }
  return body;
}