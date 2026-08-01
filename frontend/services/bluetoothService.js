import { Platform } from 'react-native';

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

export async function getConnectedCarBluetoothDeviceName() {
  return null;
}

export function subscribeToBluetoothRouteChanges(_callback) {
  return () => {};
}

export async function getSuggestedBluetoothDeviceName() {
  return getConnectedCarBluetoothDeviceName();
}

export function isBluetoothConnected(deviceName) {
  return Boolean(deviceName);
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
