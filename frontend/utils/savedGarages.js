import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saved_garages';

function normalizeGarage(garage) {
  if (!garage?.id) {
    return null;
  }

  return {
    id: String(garage.id),
    name: garage.name || 'Garage',
    address: garage.address || '',
    latitude: garage.latitude ?? null,
    longitude: garage.longitude ?? null,
    ratePerHour: garage.ratePerHour || garage.rate_per_hour || '',
    rating: garage.rating ?? null,
    savedAt: garage.savedAt || new Date().toISOString(),
  };
}

export async function loadSavedGarages() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored
      .map(normalizeGarage)
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch {
    return [];
  }
}

export async function saveSavedGarages(garages) {
  const normalized = garages.map(normalizeGarage).filter(Boolean);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function isGarageSaved(garageId, savedGarages = []) {
  const id = String(garageId);
  return savedGarages.some((garage) => String(garage.id) === id);
}

export async function toggleSavedGarage(garage) {
  const normalized = normalizeGarage(garage);

  if (!normalized) {
    return loadSavedGarages();
  }

  const current = await loadSavedGarages();
  const exists = current.some((item) => String(item.id) === normalized.id);

  if (exists) {
    return saveSavedGarages(
      current.filter((item) => String(item.id) !== normalized.id)
    );
  }

  return saveSavedGarages([normalized, ...current]);
}

export async function removeSavedGarage(garageId) {
  const current = await loadSavedGarages();
  return saveSavedGarages(
    current.filter((item) => String(item.id) !== String(garageId))
  );
}
