import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './client';
import { isDevMockToken } from './devAuth';

const DEV_SMS_CODE_KEY = 'dev_password_reset_sms_code';

function formatError(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x.msg ? x.msg : JSON.stringify(x))).join(', ');
  }
  return 'Request failed';
}

export async function requestPasswordResetEmail(accessToken) {
  if (isDevMockToken(accessToken)) {
    const devResetLink = 'intellipark://reset-password?token=dev-reset-token';
    return {
      message: 'We emailed a password reset link to dev@localhost.',
      email: 'dev@localhost',
      dev_reset_link: devResetLink,
    };
  }

  const response = await fetch(`${API_BASE}/users/me/password-reset/email`, {
    method: 'POST',
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

export async function sendPasswordResetSms(accessToken) {
  if (isDevMockToken(accessToken)) {
    const devCode = '123456';
    await AsyncStorage.setItem(DEV_SMS_CODE_KEY, devCode);

    return {
      message: 'We texted a verification code to (555) 000-0000.',
      phone: '(555) 000-0000',
      dev_code: devCode,
    };
  }

  const response = await fetch(`${API_BASE}/users/me/password-reset/sms/send`, {
    method: 'POST',
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

export async function confirmPasswordResetSms(accessToken, { code, newPassword }) {
  if (isDevMockToken(accessToken)) {
    const expected = await AsyncStorage.getItem(DEV_SMS_CODE_KEY);

    if (!expected || expected !== String(code).trim()) {
      throw new Error('Invalid or expired verification code');
    }

    await AsyncStorage.removeItem(DEV_SMS_CODE_KEY);

    return {
      message: 'Password updated successfully.',
    };
  }

  const response = await fetch(`${API_BASE}/users/me/password-reset/sms/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      code: String(code).trim(),
      new_password: newPassword,
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatError(body));
  }

  return body;
}

export async function confirmPasswordResetToken({ token, newPassword }) {
  const response = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatError(body));
  }

  return body;
}
