import { findNearestParkingLot } from './parkingLotMatch';

export function isInsideGarageGeofence(coordinate, lots = []) {
  return Boolean(findNearestParkingLot(coordinate, lots));
}

export function getGarageGeofenceMatch(coordinate, lots = []) {
  return findNearestParkingLot(coordinate, lots);
}
