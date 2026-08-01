import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRACKING_STORAGE_KEYS = {
  trackedCarId: 'tracked_car_id',
  parkingHistory: 'parking_history',
  carStates: 'car_tracking_states',
};

export async function loadTrackedCarId() {
  return AsyncStorage.getItem(TRACKING_STORAGE_KEYS.trackedCarId);
}

export async function saveTrackedCarId(carId) {
  if (carId == null) {
    await AsyncStorage.removeItem(TRACKING_STORAGE_KEYS.trackedCarId);
    return;
  }

  await AsyncStorage.setItem(
    TRACKING_STORAGE_KEYS.trackedCarId,
    String(carId)
  );
}

export async function loadParkingHistory() {
  const raw = await AsyncStorage.getItem(
    TRACKING_STORAGE_KEYS.parkingHistory
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveParkingHistory(history) {
  await AsyncStorage.setItem(
    TRACKING_STORAGE_KEYS.parkingHistory,
    JSON.stringify(history)
  );
}

export async function loadCarTrackingStates() {
  const raw = await AsyncStorage.getItem(TRACKING_STORAGE_KEYS.carStates);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveCarTrackingStates(states) {
  await AsyncStorage.setItem(
    TRACKING_STORAGE_KEYS.carStates,
    JSON.stringify(states)
  );
}

export function extractTrackingFields(car) {
  return {
    status: car.status || 'parked',
    parkedAt: car.parkedAt || null,
    tripStartedAt: car.tripStartedAt || null,
    tripDistanceMeters: car.tripDistanceMeters || 0,
    parkedLocation: car.parkedLocation || null,
    parkedLotId: car.parkedLotId || null,
    parkedLotName: car.parkedLotName || null,
    parkedLotAddress: car.parkedLotAddress || null,
    parkedLotRate: car.parkedLotRate || null,
    bluetoothDeviceId: car.bluetoothDeviceId || null,
    bluetoothDeviceName: car.bluetoothDeviceName || null,
    lastKnownSpeedMph: car.lastKnownSpeedMph ?? null,
  };
}

export function applyStoredTrackingState(car, storedStates) {
  const saved = storedStates?.[String(car.id)];

  if (!saved) {
    return {
      ...car,
      status: car.status || 'parked',
    };
  }

  return {
    ...car,
    ...saved,
  };
}
