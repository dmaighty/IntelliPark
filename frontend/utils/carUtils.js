import { getCarImages } from '../data/carImages';

export const LICENSE_PLATE_MIN_LENGTH = 5;
export const LICENSE_PLATE_MAX_LENGTH = 8;

// Common CA passenger format (e.g. 8ABC123) plus general alphanumeric plates.
const LICENSE_PLATE_PATTERN =
  /^([0-9][A-Z]{3}[0-9]{3}|[A-Z]{3}[0-9]{3}[A-Z]|[A-Z0-9]{5,8})$/;

export const normalizeLicensePlate = (value) =>
  String(value || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, LICENSE_PLATE_MAX_LENGTH);

export const getLicensePlateValidationMessage = (value) => {
  const plate = normalizeLicensePlate(value);

  if (!plate) {
    return 'Please enter a license plate.';
  }

  if (plate.length < LICENSE_PLATE_MIN_LENGTH) {
    return `License plate must be at least ${LICENSE_PLATE_MIN_LENGTH} characters.`;
  }

  if (plate.length > LICENSE_PLATE_MAX_LENGTH) {
    return `License plate must be ${LICENSE_PLATE_MAX_LENGTH} characters or fewer.`;
  }

  if (!/[A-Z]/.test(plate) || !/[0-9]/.test(plate)) {
    return 'License plate must include both letters and numbers.';
  }

  if (!LICENSE_PLATE_PATTERN.test(plate)) {
    return 'Enter a valid plate like 8ABC123.';
  }

  return '';
};

export const isValidLicensePlate = (value) => {
  return getLicensePlateValidationMessage(value) === '';
};

export const generatePlaceholderLicensePlate = (car) => {
  const name = String(car?.title || car?.name || car?.make || 'CAR')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const letters = (name + 'XXX').slice(0, 3);
  const seed = hashSeed(car?.id ?? name);
  const prefix = 1 + (seed % 9);
  const suffix = String(100 + (seed % 900));

  return `${prefix}${letters}${suffix}`;
};

export const resolveLicensePlate = (car) => {
  const rawPlate = normalizeLicensePlate(
    car?.licensePlate || car?.license_plate || ''
  );

  if (isValidLicensePlate(rawPlate)) {
    return rawPlate;
  }

  return generatePlaceholderLicensePlate(car);
};

const hashSeed = (value) => {
  const text = String(value ?? '0');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }

  return hash || 1;
};

const seededRandom = (seed, salt = 1) => {
  const value = Math.sin(seed * salt) * 10000;
  return value - Math.floor(value);
};

const FALLBACK_PARKING_SPOTS = [
  { latitude: 37.3329, longitude: -121.8808 },
  { latitude: 37.3342, longitude: -121.8851 },
  { latitude: 37.3376, longitude: -121.8831 },
  { latitude: 37.3348, longitude: -121.8738 },
  { latitude: 37.3364, longitude: -121.8949 },
];

const LOCATION_MATCH_THRESHOLD = 0.0004;

const locationsAreNear = (a, b) => {
  if (!a || !b) {
    return false;
  }

  return (
    Math.abs(a.latitude - b.latitude) < LOCATION_MATCH_THRESHOLD &&
    Math.abs(a.longitude - b.longitude) < LOCATION_MATCH_THRESHOLD
  );
};

export const generateRandomParkedLocation = (seed = Date.now(), index = 0) => {
  const spot = FALLBACK_PARKING_SPOTS[index % FALLBACK_PARKING_SPOTS.length];
  const numericSeed = hashSeed(`${seed}-${index}`);
  const jitterLat = (seededRandom(numericSeed, 1.1) - 0.5) * 0.002;
  const jitterLng = (seededRandom(numericSeed, 2.3) - 0.5) * 0.002;

  return {
    latitude: spot.latitude + jitterLat,
    longitude: spot.longitude + jitterLng,
  };
};

export const formatParkingDuration = (parkedAt, now = Date.now()) => {
  if (!parkedAt) {
    return '';
  }

  const start = new Date(parkedAt).getTime();

  if (!Number.isFinite(start)) {
    return '';
  }

  const totalMinutes = Math.max(0, Math.floor((now - start) / 60000));
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
};

export const getCarStatusLabel = (
  car,
  now = Date.now()
) => {
  const status = car?.status || 'unknown';
  const speedMph = car?.lastKnownSpeedMph ?? car?.speedMph ?? null;

  if (status === 'driving') {
    return Number(speedMph) > 0
      ? `Driving • ${speedMph} mph`
      : 'Driving';
  }

  if (status === 'parking') {
    return 'Parking detected';
  }

  if (status === 'parked') {
    const duration = formatParkingDuration(car?.parkedAt, now);
    const locationLabel = car?.parkedLotName
      ? `Parked at ${car.parkedLotName}`
      : 'Parked';

    return duration
      ? `${locationLabel} • ${duration}`
      : locationLabel;
  }

  return 'Status unavailable';
};

const spreadParkedLocations = (cars) => {
  const usedLocations = [];

  return cars.map((car, index) => {
    let location = car.parkedLocation;
    const collidesWithExisting =
      location &&
      usedLocations.some((used) => locationsAreNear(used, location));

    if (!location || collidesWithExisting) {
      location = generateRandomParkedLocation(car.id, index);

      let attempt = 0;
      while (
        usedLocations.some((used) => locationsAreNear(used, location)) &&
        attempt < 12
      ) {
        location = generateRandomParkedLocation(
          `${car.id}-${attempt}`,
          index + attempt + 1
        );
        attempt += 1;
      }
    }

    usedLocations.push(location);

    return {
      ...car,
      parkedLocation: location,
    };
  });
};

export const normalizeColorId = (value, fallback = 'black') => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || fallback;
};

export const getCarDisplayName = (car) => {
  if (!car) {
    return 'Untitled Car';
  }

  const userCarName = String(car.title || car.name || '').trim();

  if (userCarName) {
    return userCarName;
  }

  const makeAndModel = String(car.make || car.model || '').trim();

  if (makeAndModel) {
    return makeAndModel;
  }

  return 'Untitled Car';
};

export const getCarSubtitle = (car) => {
  if (!car) {
    return '';
  }

  const year = String(car.year || '').trim();
  const makeAndModel = String(car.make || car.model || '').trim();

  return [year, makeAndModel].filter(Boolean).join(' ');
};

export const hydrateCar = (car) => {
  if (!car) {
    return null;
  }

  const colorId = normalizeColorId(
    car.colorId || car.color_id || car.color
  );
  const images = getCarImages(colorId);

  const parkedLocation =
    car.parkedLocation ||
    car.parked_location ||
    (car.parked_latitude != null && car.parked_longitude != null
      ? {
          latitude: car.parked_latitude,
          longitude: car.parked_longitude,
        }
      : null);

  const licensePlate = resolveLicensePlate(car);

  return {
    ...car,
    id: car.id != null ? String(car.id) : car.id,
    title: car.title || car.name || car.car_name || '',
    make: car.make || car.model || car.make_model || '',
    licensePlate,
    license_plate: licensePlate,
    colorId,
    color: colorId.charAt(0).toUpperCase() + colorId.slice(1),
    image: images.image,
    parkedImage: images.parkedImage,
    parkedLocation,
    status: car.status || 'parked',
    parkedAt: car.parkedAt || car.parked_at || null,
    tripStartedAt: car.tripStartedAt || car.trip_started_at || null,
    tripDistanceMeters:
      car.tripDistanceMeters ?? car.trip_distance_meters ?? 0,
    bluetoothDeviceId:
      car.bluetoothDeviceId || car.bluetooth_device_id || null,
    bluetoothDeviceName:
      car.bluetoothDeviceName || car.bluetooth_device_name || null,
    parkedLotId: car.parkedLotId || car.parked_lot_id || null,
    parkedLotName: car.parkedLotName || car.parked_lot_name || null,
    parkedLotAddress:
      car.parkedLotAddress || car.parked_lot_address || null,
    parkedLotRate: car.parkedLotRate || car.parked_lot_rate || null,
  };
};

export const hydrateCars = (cars) => {
  if (!Array.isArray(cars)) {
    return [];
  }

  return spreadParkedLocations(
    cars.map(hydrateCar).filter(Boolean)
  );
};
