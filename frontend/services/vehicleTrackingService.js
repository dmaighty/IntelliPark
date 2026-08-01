export const CAR_STATUS = {
  PARKED: 'parked',
  DRIVING: 'driving',
  PARKING: 'parking',
  UNKNOWN: 'unknown',
};

export const TRACKING_CONFIG = {
  DRIVING_SPEED_MPH: 8,
  PARKED_SPEED_MPH: 1,
  STOP_CONFIRM_MS: 15000,
  MIN_DISTANCE_METERS: 10,
  PARKED_GPS_DRIFT_METERS: 40,
};

const MPS_TO_MPH = 2.23694;

export function metersPerSecondToMph(speedMps) {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) {
    return 0;
  }

  return speedMps * MPS_TO_MPH;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceMetersBetween(a, b) {
  if (!a || !b) {
    return 0;
  }

  const earthRadius = 6371000;
  const latDelta = toRadians(b.latitude - a.latitude);
  const lonDelta = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function estimateSpeedMph(current, previous, elapsedMs) {
  if (!current || !previous || elapsedMs <= 0) {
    return 0;
  }

  const distanceMeters = distanceMetersBetween(
    {
      latitude: previous.latitude,
      longitude: previous.longitude,
    },
    {
      latitude: current.latitude,
      longitude: current.longitude,
    }
  );

  const metersPerSecond = distanceMeters / (elapsedMs / 1000);
  return metersPerSecondToMph(metersPerSecond);
}

export function resolveSpeedMph(location, previousSample) {
  const reportedSpeed = metersPerSecondToMph(location?.coords?.speed);

  if (reportedSpeed > 0) {
    return reportedSpeed;
  }

  if (!previousSample) {
    return 0;
  }

  const elapsedMs = location.timestamp - previousSample.timestamp;

  return estimateSpeedMph(
    {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    },
    {
      latitude: previousSample.latitude,
      longitude: previousSample.longitude,
    },
    elapsedMs
  );
}

export function nextTrackingState({
  currentStatus = CAR_STATUS.UNKNOWN,
  speedMph = 0,
  stoppedSince = null,
  now = Date.now(),
}) {
  const { DRIVING_SPEED_MPH, PARKED_SPEED_MPH, STOP_CONFIRM_MS } =
    TRACKING_CONFIG;

  if (currentStatus === CAR_STATUS.DRIVING) {
    if (speedMph >= DRIVING_SPEED_MPH) {
      return {
        status: CAR_STATUS.DRIVING,
        stoppedSince: null,
      };
    }

    return {
      status: CAR_STATUS.PARKING,
      stoppedSince: stoppedSince || now,
    };
  }

  if (currentStatus === CAR_STATUS.PARKING) {
    if (speedMph >= DRIVING_SPEED_MPH) {
      return {
        status: CAR_STATUS.DRIVING,
        stoppedSince: null,
      };
    }

    if (stoppedSince && now - stoppedSince >= STOP_CONFIRM_MS) {
      return {
        status: CAR_STATUS.PARKED,
        stoppedSince: null,
      };
    }

    return {
      status: CAR_STATUS.PARKING,
      stoppedSince: stoppedSince || now,
    };
  }

  if (speedMph >= DRIVING_SPEED_MPH) {
    return {
      status: CAR_STATUS.DRIVING,
      stoppedSince: null,
    };
  }

  if (speedMph <= PARKED_SPEED_MPH) {
    return {
      status: CAR_STATUS.PARKED,
      stoppedSince: null,
    };
  }

  return {
    status: currentStatus === CAR_STATUS.UNKNOWN
      ? CAR_STATUS.PARKED
      : currentStatus,
    stoppedSince: null,
  };
}

export function applyTrackingSample({
  car,
  location,
  previousSample,
  stoppedSince = null,
}) {
  const speedMph = resolveSpeedMph(location, previousSample);
  const now = location.timestamp || Date.now();
  const currentStatus = car?.status || CAR_STATUS.UNKNOWN;

  const coordinate = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  const distanceFromParkedSpot = car.parkedLocation
    ? distanceMetersBetween(coordinate, car.parkedLocation)
    : 0;

  let effectiveSpeedMph = speedMph;

  if (
    currentStatus === CAR_STATUS.PARKED &&
    distanceFromParkedSpot <
      TRACKING_CONFIG.PARKED_GPS_DRIFT_METERS
  ) {
    effectiveSpeedMph = 0;
  }

  const { status, stoppedSince: nextStoppedSince } = nextTrackingState({
    currentStatus,
    speedMph: effectiveSpeedMph,
    stoppedSince,
    now,
  });

  let nextCar = {
    ...car,
    status,
    isCurrentVehicle: true,
    lastKnownSpeedMph: Math.round(speedMph),
    lastLocationSampleAt: new Date(now).toISOString(),
  };

  if (status === CAR_STATUS.DRIVING) {
    nextCar = {
      ...nextCar,
      tripStartedAt: car.tripStartedAt || new Date(now).toISOString(),
      parkedAt: null,
      parkedLotId: null,
      parkedLotName: null,
      parkedLotAddress: null,
      parkedLotRate: null,
    };
  }

  const justStartedDriving =
    status === CAR_STATUS.DRIVING &&
    (currentStatus === CAR_STATUS.PARKED ||
      currentStatus === CAR_STATUS.PARKING);

  const justParked =
    status === CAR_STATUS.PARKED &&
    (currentStatus === CAR_STATUS.DRIVING ||
      currentStatus === CAR_STATUS.PARKING);

  if (status === CAR_STATUS.PARKED) {
    nextCar = {
      ...nextCar,
      parkedAt: justParked
        ? new Date(now).toISOString()
        : car.parkedAt || new Date(now).toISOString(),
      parkedLocation: justParked
        ? coordinate
        : car.parkedLocation || coordinate,
      tripStartedAt: null,
      tripDistanceMeters: 0,
    };
  }

  if (status === CAR_STATUS.PARKING) {
    nextCar = {
      ...nextCar,
      parkedLocation: car.parkedLocation || coordinate,
    };
  }

  if (
    status === CAR_STATUS.DRIVING &&
    previousSample &&
    currentStatus === CAR_STATUS.DRIVING
  ) {
    const deltaMeters = distanceMetersBetween(
      {
        latitude: previousSample.latitude,
        longitude: previousSample.longitude,
      },
      coordinate
    );

    nextCar.tripDistanceMeters =
      (car.tripDistanceMeters || 0) + deltaMeters;
  }

  return {
    car: nextCar,
    speedMph,
    stoppedSince: nextStoppedSince,
    justStartedDriving,
    justParked,
    coordinate,
  };
}
