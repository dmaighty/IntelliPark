import { Platform } from 'react-native';
import { defaultGarages } from '../data/defaultGarages';

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
  return buildDirectionsUrlForPoint(garage.latitude, garage.longitude);
};

export const buildDirectionsUrlForPoint = (latitude, longitude) => {
  const destination = `${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

export const sortGaragesByDistance = (point, garages) => {
  return [...garages].sort(
    (a, b) => getDistanceMiles(point, a) - getDistanceMiles(point, b)
  );
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

export const mapParkingLotApiToGarage = (row) => {
  const lat =
    row.latitude != null ? Number(row.latitude) : DEFAULT_COORDS.latitude;
  const lng =
    row.longitude != null ? Number(row.longitude) : DEFAULT_COORDS.longitude;

  return enrichGarageWithDefaults({
    id: String(row.id),
    name: row.name ?? '',
    address: row.address ?? '',
    latitude: lat,
    longitude: lng,
    rating: row.rating != null ? Number(row.rating) : 0,
    ratePerHour: row.rate_per_hour ?? '',
    spotsOpen: row.spots_open != null ? Number(row.spots_open) : null,
    details: row.details ?? '',
    schedule: row.schedule ?? '',
    peakTimes: Array.isArray(row.peak_times) ? row.peak_times : [],
    levels: [],
    lotType: row.lot_type ?? '',
    totalSpaces: row.total_spaces ?? 0,
  });
};

export const enrichGarageWithDefaults = (garage) => {
  if (!garage) {
    return garage;
  }

  const match = defaultGarages.find(
    (item) =>
      String(item.id) === String(garage.id) ||
      item.name === garage.name
  );

  if (!match) {
    return garage;
  }

  return {
    ...garage,
    levels: garage.levels?.length ? garage.levels : match.levels || [],
    peakTimes: garage.peakTimes?.length ? garage.peakTimes : match.peakTimes || [],
    details: garage.details || match.details || '',
    schedule: garage.schedule || match.schedule || '',
    ratePerHour: garage.ratePerHour || match.ratePerHour || '',
    rating: garage.rating || match.rating || 0,
  };
};