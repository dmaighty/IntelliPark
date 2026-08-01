import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'find_navigation_recents';
const MAX_RECENTS = 8;

export async function loadNavigationRecents() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addNavigationRecent(entry) {
  if (!entry?.id || !entry?.name) {
    return;
  }

  try {
    const current = await loadNavigationRecents();
    const next = [
      {
        ...entry,
        navigatedAt: new Date().toISOString(),
      },
      ...current.filter((item) => item.id !== entry.id),
    ].slice(0, MAX_RECENTS);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}
