import { Platform } from 'react-native';

export const DEFAULT_COORDS = {
  latitude: 37.3352,
  longitude: -121.8811,
};

export const getDistanceMiles = (a, b) => {
  if (!a || !b) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusMiles * c;
};

export const buildDirectionsUrl = (garage) => {
  const destination = `${garage.latitude},${garage.longitude}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

export const getTop5ClosestGarages = (point, garages) => {
  return [...garages]
    .sort((a, b) => getDistanceMiles(point, a) - getDistanceMiles(point, b))
    .slice(0, 5);
};

export const getOffsetRegion = (
  coordinate,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01
) => ({
  latitude: coordinate.latitude - latitudeDelta * 0.28,
  longitude: coordinate.longitude,
  latitudeDelta,
  longitudeDelta,
});