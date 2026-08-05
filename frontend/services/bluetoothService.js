import { Platform } from 'react-native';

let activeSessionDeviceName = null;
const routeListeners = new Set();

function notifyRouteListeners() {
  routeListeners.forEach((callback) => {
    try {
      callback(activeSessionDeviceName);
    } catch {
      // Ignore listener failures.
    }
  });
}

export async function requestBluetoothPermissions() {
  if (Platform.OS === 'web') {
    return false;
  }

  return true;
}

export function normalizeBluetoothName(value) {
  return String(value || '').trim().toLowerCase();
}

export function bluetoothNamesMatch(savedName, connectedName) {
  const saved = normalizeBluetoothName(savedName);
  const connected = normalizeBluetoothName(connectedName);

  if (!saved || !connected) {
    return false;
  }

  return (
    saved === connected ||
    connected.includes(saved) ||
    saved.includes(connected)
  );
}

export function findCarForBluetoothDevice(cars, deviceName) {
  if (!deviceName || !Array.isArray(cars)) {
    return null;
  }

  const matches = cars.filter(
    (car) =>
      car?.bluetoothDeviceName &&
      bluetoothNamesMatch(car.bluetoothDeviceName, deviceName)
  );

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

export function startBluetoothSession(deviceName) {
  activeSessionDeviceName = String(deviceName || '').trim() || null;
  notifyRouteListeners();
}

export function endBluetoothSession() {
  if (!activeSessionDeviceName) {
    return false;
  }

  activeSessionDeviceName = null;
  notifyRouteListeners();
  return true;
}

export function isBluetoothSessionActive() {
  return Boolean(activeSessionDeviceName);
}

export async function getConnectedCarBluetoothDeviceName() {
  return activeSessionDeviceName;
}

export function subscribeToBluetoothRouteChanges(callback) {
  if (typeof callback !== 'function') {
    return () => {};
  }

  routeListeners.add(callback);

  return () => {
    routeListeners.delete(callback);
  };
}

export async function getSuggestedBluetoothDeviceName() {
  return getConnectedCarBluetoothDeviceName();
}

export function isBluetoothConnected(deviceName) {
  if (!deviceName) {
    return false;
  }

  return bluetoothNamesMatch(deviceName, activeSessionDeviceName);
}

export function getBluetoothStatusLabel(deviceName, isDriving) {
  if (!deviceName) {
    return isDriving ? 'Driving with this car' : 'No car linked';
  }

  if (isDriving) {
    return `Driving • ${deviceName}`;
  }

  return `Saved device: ${deviceName}`;
}
