import { getCarDisplayName } from './carUtils';
import { formatSpendLabel } from './parkingSpendUtils';

export function formatDurationBetween(startIso, endIso = new Date().toISOString()) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return '';
  }

  const totalMinutes = Math.max(0, Math.floor((end - start) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes < 1) {
    return 'less than a minute';
  }

  return `${minutes}m`;
}

export function formatHistoryDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatHistoryTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return '';
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return '';
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function resolveHistoryLocation({
  car,
  parkingLot = null,
  address = null,
  latitude = null,
  longitude = null,
}) {
  const lat = latitude ?? car?.parkedLocation?.latitude ?? null;
  const lng = longitude ?? car?.parkedLocation?.longitude ?? null;
  const coords = formatCoordinates(lat, lng);
  const cleanedAddress =
    address && address !== 'Location tracked from your phone'
      ? address
      : '';

  if (parkingLot?.name) {
    return {
      lotName: parkingLot.name,
      locationLabel: parkingLot.name,
      locationDetail: parkingLot.address || cleanedAddress || coords || '',
      address: parkingLot.address || cleanedAddress || coords || '',
      rate: parkingLot.ratePerHour || parkingLot.rate_per_hour || '',
      parkingLotId: String(parkingLot.id),
      latitude: lat,
      longitude: lng,
    };
  }

  if (car?.parkedLotName) {
    return {
      lotName: car.parkedLotName,
      locationLabel: car.parkedLotName,
      locationDetail: car.parkedLotAddress || cleanedAddress || coords || '',
      address: car.parkedLotAddress || cleanedAddress || coords || '',
      rate: car.parkedLotRate || '',
      parkingLotId: car.parkedLotId ? String(car.parkedLotId) : null,
      latitude: lat,
      longitude: lng,
    };
  }

  if (cleanedAddress) {
    return {
      lotName: cleanedAddress,
      locationLabel: cleanedAddress,
      locationDetail: coords || '',
      address: cleanedAddress,
      rate: '',
      parkingLotId: null,
      latitude: lat,
      longitude: lng,
    };
  }

  if (coords) {
    return {
      lotName: coords,
      locationLabel: coords,
      locationDetail: 'GPS coordinates',
      address: coords,
      rate: '',
      parkingLotId: null,
      latitude: lat,
      longitude: lng,
    };
  }

  return {
    lotName: 'Unknown location',
    locationLabel: 'Unknown location',
    locationDetail: '',
    address: '',
    rate: '',
    parkingLotId: null,
    latitude: lat,
    longitude: lng,
  };
}

export function getHistoryLocationDisplay(item) {
  const label =
    item?.locationLabel ||
    (item?.lotName && item.lotName !== 'Parked location'
      ? item.lotName
      : '') ||
    item?.address ||
    formatCoordinates(item?.latitude, item?.longitude) ||
    'Unknown location';

  const detail =
    item?.locationDetail ||
    (item?.lotName &&
    item?.address &&
    item.lotName !== item.address &&
    item.lotName !== 'Parked location'
      ? item.address
      : '') ||
    (item?.locationLabel &&
    formatCoordinates(item?.latitude, item?.longitude) &&
    item.locationLabel !== formatCoordinates(item?.latitude, item?.longitude)
      ? formatCoordinates(item?.latitude, item?.longitude)
      : '');

  return {
    label,
    detail,
  };
}

export function getHistoryCarOptions(history, cars = []) {
  const options = new Map();

  cars.forEach((car) => {
    options.set(String(car.id), {
      id: String(car.id),
      label: getCarDisplayName(car),
    });
  });

  history.forEach((item) => {
    if (!item?.carId) {
      return;
    }

    options.set(String(item.carId), {
      id: String(item.carId),
      label: item.carName || 'Vehicle',
    });
  });

  return [{ id: 'all', label: 'All cars' }, ...Array.from(options.values())];
}

export function filterHistoryItems(history, { query = '', carId = 'all' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return history.filter((item) => {
    if (carId !== 'all' && String(item.carId) !== String(carId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const location = getHistoryLocationDisplay(item);
    const haystack = [
      item.carName,
      item.licensePlate,
      location.label,
      location.detail,
      item.date,
      item.duration,
      item.startTime,
      item.endTime,
      item.rate,
      item.total,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function buildParkingHistoryEntry({
  car,
  parkedAt,
  endedAt = new Date().toISOString(),
  parkingLot = null,
  address = null,
}) {
  const duration = formatDurationBetween(parkedAt, endedAt);
  const location = resolveHistoryLocation({ car, parkingLot, address });
  const total = formatSpendLabel(location.rate, parkedAt, endedAt);

  return {
    id: `${car.id}-${endedAt}`,
    carId: String(car.id),
    carName: getCarDisplayName(car),
    licensePlate: car.licensePlate || '',
    lotName: location.lotName,
    locationLabel: location.locationLabel,
    locationDetail: location.locationDetail,
    address: location.address,
    parkingLotId: location.parkingLotId,
    level: '',
    spot: '',
    date: formatHistoryDate(parkedAt),
    startTime: formatHistoryTime(parkedAt),
    endTime: formatHistoryTime(endedAt),
    duration,
    rate: location.rate,
    total,
    parkedAt,
    endedAt,
    latitude: car.parkedLocation?.latitude ?? null,
    longitude: car.parkedLocation?.longitude ?? null,
  };
}

export function buildActiveParkingEntry({ car }) {
  if (!car?.parkedAt || car.status !== 'parked') {
    return null;
  }

  const location = resolveHistoryLocation({ car });

  return {
    id: `active-${car.id}`,
    carId: String(car.id),
    carName: getCarDisplayName(car),
    licensePlate: car.licensePlate || '',
    lotName: location.lotName,
    locationLabel: location.locationLabel,
    locationDetail: location.locationDetail,
    address: location.address,
    parkingLotId: location.parkingLotId,
    level: '',
    spot: '',
    date: formatHistoryDate(car.parkedAt),
    startTime: formatHistoryTime(car.parkedAt),
    endTime: 'In progress',
    duration: formatDurationBetween(car.parkedAt),
    rate: location.rate,
    total: formatSpendLabel(location.rate, car.parkedAt),
    parkedAt: car.parkedAt,
    endedAt: null,
    isActive: true,
    latitude: car.parkedLocation?.latitude ?? null,
    longitude: car.parkedLocation?.longitude ?? null,
  };
}

export function mergeHistoryWithActiveSession(history, cars) {
  const activeEntries = cars
    .map((car) => buildActiveParkingEntry({ car }))
    .filter(Boolean);

  const activeCarIds = new Set(
    activeEntries.map((entry) => entry.carId)
  );

  const withoutStaleActive = history.filter((item) => {
    if (!item.isActive) {
      return !activeCarIds.has(String(item.carId));
    }

    return false;
  });

  return [...activeEntries, ...withoutStaleActive];
}
