import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  showBanner: true,
};

export async function loadNotificationSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    const stored = JSON.parse(raw);

    return {
      enabled:
        typeof stored.enabled === 'boolean'
          ? stored.enabled
          : DEFAULT_NOTIFICATION_SETTINGS.enabled,
      showBanner:
        typeof stored.showBanner === 'boolean'
          ? stored.showBanner
          : DEFAULT_NOTIFICATION_SETTINGS.showBanner,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(settings) {
  const next = {
    enabled: Boolean(settings.enabled),
    showBanner: Boolean(settings.showBanner),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getNotificationStyleLabel(showBanner) {
  return showBanner ? 'Banner' : 'No banner';
}
