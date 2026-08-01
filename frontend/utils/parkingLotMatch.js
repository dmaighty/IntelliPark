import { distanceMetersBetween } from '../services/vehicleTrackingService';

export const PARKING_LOT_MATCH_RADIUS_METERS = 350;

export function normalizeLotForMatch(lot) {
  if (!lot) {
    return null;
  }

  const latitude =
    lot.latitude != null ? Number(lot.latitude) : null;
  const longitude =
    lot.longitude != null ? Number(lot.longitude) : null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: String(lot.id),
    name: lot.name || '',
    address: lot.address || '',
    latitude,
    longitude,
    ratePerHour: lot.rate_per_hour || lot.ratePerHour || '',
    lotType: lot.lot_type || lot.lotType || '',
  };
}

export function findNearestParkingLot(coordinate, lots = []) {
  if (!coordinate) {
    return null;
  }

  let nearest = null;
  let nearestDistance = Infinity;

  lots.forEach((rawLot) => {
    const lot = normalizeLotForMatch(rawLot);

    if (!lot) {
      return;
    }

    const distanceMeters = distanceMetersBetween(coordinate, lot);

    if (
      distanceMeters <= PARKING_LOT_MATCH_RADIUS_METERS &&
      distanceMeters < nearestDistance
    ) {
      nearest = lot;
      nearestDistance = distanceMeters;
    }
  });

  if (!nearest) {
    return null;
  }

  return {
    lot: nearest,
    distanceMeters: nearestDistance,
  };
}

export function applyParkingLotToCar(car, coordinate, lots = []) {
  const match = findNearestParkingLot(coordinate, lots);

  if (!match) {
    return {
      ...car,
      parkedLotId: null,
      parkedLotName: null,
      parkedLotAddress: null,
      parkedLotRate: null,
    };
  }

  return {
    ...car,
    parkedLotId: match.lot.id,
    parkedLotName: match.lot.name,
    parkedLotAddress: match.lot.address,
    parkedLotRate: match.lot.ratePerHour,
  };
}
