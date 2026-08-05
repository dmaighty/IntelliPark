import { Linking, Platform } from 'react-native';

export function buildWalkingDirectionsUrlForPoint(latitude, longitude) {
  const destination = `${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&dirflg=w`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
}

export async function openWalkingDirections(coordinate) {
  if (!coordinate?.latitude || !coordinate?.longitude) {
    return false;
  }

  const url = buildWalkingDirectionsUrlForPoint(
    coordinate.latitude,
    coordinate.longitude
  );

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
