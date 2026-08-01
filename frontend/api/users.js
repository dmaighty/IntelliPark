import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './client';
import { getMockUser, isDevMockToken } from './devAuth';

const DEV_PROFILE_IMAGE_KEY = 'dev_profile_image_url';

function formatError(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(', ');
  }
  return 'Request failed';
}

async function getDevMockProfile() {
  const storedImage = await AsyncStorage.getItem(DEV_PROFILE_IMAGE_KEY);

  return {
    ...getMockUser(),
    profile_image_url: storedImage || null,
  };
}

export async function getUser(userId) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && userId === 0) {
    return getDevMockProfile();
  }
  const response = await fetch(`${API_BASE}/users/${userId}`);
  return response.json();
}

export async function getMyProfile(accessToken) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && isDevMockToken(accessToken)) {
    return getDevMockProfile();
  }
  const response = await fetch(`${API_BASE}/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(formatError(body));
  }
  return body;
}

export async function updateMyProfile(accessToken, updates) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && isDevMockToken(accessToken)) {
    const base = await getDevMockProfile();

    if (updates.profile_image_url != null) {
      const nextImage = updates.profile_image_url || null;

      if (nextImage) {
        await AsyncStorage.setItem(DEV_PROFILE_IMAGE_KEY, nextImage);
      } else {
        await AsyncStorage.removeItem(DEV_PROFILE_IMAGE_KEY);
      }
    }

    return {
      ...base,
      ...(updates.full_name != null ? { full_name: updates.full_name } : {}),
      ...(updates.email != null ? { email: String(updates.email) } : {}),
      ...(updates.phone != null ? { phone: updates.phone } : {}),
      ...(updates.profile_image_url != null
        ? { profile_image_url: updates.profile_image_url || null }
        : {}),
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
