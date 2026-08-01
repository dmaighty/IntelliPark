import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'find_saved_places';

export const SAVED_PLACE_IDS = ['home', 'work', 'school'];

const PLACE_TEMPLATES = {
  home: {
    id: 'home',
    label: 'Home',
    icon: 'home',
    address: '',
    latitude: null,
    longitude: null,
    configured: false,
  },
  work: {
    id: 'work',
    label: 'Work',
    icon: 'briefcase',
    address: '',
    latitude: null,
    longitude: null,
    configured: false,
  },
  school: {
    id: 'school',
    label: 'School',
    icon: 'school',
    address: '',
    latitude: null,
    longitude: null,
    configured: false,
  },
};

export function isPlaceConfigured(place) {
  return (
    Boolean(place?.configured) &&
    Boolean(String(place?.address || '').trim()) &&
    place.latitude != null &&
    place.longitude != null &&
    Number.isFinite(Number(place.latitude)) &&
    Number.isFinite(Number(place.longitude))
  );
}

export function hasConfiguredSavedPlaces(places) {
  if (!Array.isArray(places)) {
    return false;
  }

  return places.some(isPlaceConfigured);
}

export function getConfiguredSavedPlaces(places) {
  if (!Array.isArray(places)) {
    return [];
  }

  return places.filter(isPlaceConfigured);
}

export async function loadSavedPlaces() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    return SAVED_PLACE_IDS.map((id) => ({
      ...PLACE_TEMPLATES[id],
      ...(stored[id] || {}),
    }));
  } catch {
    return SAVED_PLACE_IDS.map((id) => ({ ...PLACE_TEMPLATES[id] }));
  }
}

export async function saveSavedPlace(place) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[place.id] = {
      ...place,
      configured: isPlaceConfigured(place),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored[place.id];
  } catch {
    return null;
  }
}

export async function saveSavedPlaces(places) {
  try {
    const stored = {};

    places.forEach((place) => {
      stored[place.id] = {
        ...place,
        configured: isPlaceConfigured(place),
      };
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return loadSavedPlaces();
  } catch {
    return loadSavedPlaces();
  }
}

export function getPlaceTemplate(id) {
  return PLACE_TEMPLATES[id] ? { ...PLACE_TEMPLATES[id] } : null;
}
