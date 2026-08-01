import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Location from 'expo-location';

import { getParkingLots } from '../api/parking_lots';
import { updateVehicle } from '../api/vehicle';
import { DEV_MOCK_ACCESS_TOKEN } from '../api/devAuth';
import { defaultGarages } from '../data/defaultGarages';
import { buildParkingHistoryEntry } from '../utils/parkingHistoryUtils';
import {
  applyParkingLotToCar,
  normalizeLotForMatch,
} from '../utils/parkingLotMatch';
import {
  applyTrackingSample,
  CAR_STATUS,
  TRACKING_CONFIG,
} from '../services/vehicleTrackingService';
import {
  applyStoredTrackingState,
  extractTrackingFields,
  loadCarTrackingStates,
  loadParkingHistory,
  loadTrackedCarId,
  saveCarTrackingStates,
  saveParkingHistory,
  saveTrackedCarId,
} from '../services/trackingStorage';
import {
  findCarForBluetoothDevice,
  getConnectedCarBluetoothDeviceName,
  subscribeToBluetoothRouteChanges,
} from '../services/bluetoothService';

async function reverseGeocodeAddress(coordinate) {
  if (!coordinate) {
    return null;
  }

  try {
    const results = await Location.reverseGeocodeAsync(coordinate);

    if (!results?.length) {
      return null;
    }

    const place = results[0];
    const parts = [
      place.name,
      place.street,
      place.city,
      place.region,
    ].filter(Boolean);

    return parts.join(', ') || null;
  } catch {
    return null;
  }
}

async function loadKnownParkingLots() {
  try {
    const rows = await getParkingLots();

    if (Array.isArray(rows) && rows.length > 0) {
      return rows
        .map(normalizeLotForMatch)
        .filter(Boolean);
    }
  } catch {
    // Fall back to bundled garage data when the API is unavailable.
  }

  return defaultGarages
    .map(normalizeLotForMatch)
    .filter(Boolean);
}

function enrichCarWithParkingLot(car, coordinate, lots) {
  if (!coordinate) {
    return car;
  }

  return applyParkingLotToCar(car, coordinate, lots);
}

function enrichAllCarsWithParkingLots(cars, lots) {
  return cars.map((car) => {
    if (!car.parkedLocation) {
      return car;
    }

    if (car.parkedLotName) {
      return car;
    }

    return enrichCarWithParkingLot(
      car,
      car.parkedLocation,
      lots
    );
  });
}

export default function useVehicleTracking({
  cars,
  setCars,
  setHistory,
  accessToken,
  enabled = true,
}) {
  const [trackedCarId, setTrackedCarId] = useState(null);
  const [trackingReady, setTrackingReady] = useState(false);

  const previousSampleRef = useRef(null);
  const stoppedSinceRef = useRef(null);
  const parkingSessionRef = useRef(null);
  const subscriptionRef = useRef(null);
  const parkingLotsRef = useRef([]);
  const carsRef = useRef(cars);
  const trackedCarIdRef = useRef(trackedCarId);

  useEffect(() => {
    carsRef.current = cars;
  }, [cars]);

  useEffect(() => {
    trackedCarIdRef.current = trackedCarId;
  }, [trackedCarId]);

  const persistCarStates = useCallback(async (nextCars, activeTrackedCarId) => {
    const states = nextCars.reduce((accumulator, car) => {
      accumulator[String(car.id)] = extractTrackingFields(car);
      return accumulator;
    }, {});

    await saveCarTrackingStates(states);

    if (activeTrackedCarId) {
      await saveTrackedCarId(activeTrackedCarId);
    }
  }, []);

  const appendHistoryEntry = useCallback(
    async (entry) => {
      setHistory((previousHistory) => {
        const nextHistory = [
          entry,
          ...previousHistory.filter((item) => !item.isActive),
        ];
        saveParkingHistory(nextHistory);
        return nextHistory;
      });
    },
    [setHistory]
  );

  const persistParkedLocation = useCallback(
    async (car) => {
      if (
        !accessToken ||
        accessToken === DEV_MOCK_ACCESS_TOKEN ||
        !car?.parkedLocation
      ) {
        return;
      }

      try {
        await updateVehicle(accessToken, car.id, car);
      } catch {
        // Keep local tracking even if the API update fails.
      }
    },
    [accessToken]
  );

  const handleLocationSample = useCallback(
    async (location) => {
      if (!trackedCarId) {
        return;
      }

      let historyEntryToAppend = null;
      let carToPersist = null;

      setCars((previousCars) => {
        const trackedCar = previousCars.find(
          (car) => String(car.id) === String(trackedCarId)
        );

        if (!trackedCar) {
          return previousCars;
        }

        const result = applyTrackingSample({
          car: trackedCar,
          location,
          previousSample: previousSampleRef.current,
          stoppedSince: stoppedSinceRef.current,
        });

        stoppedSinceRef.current = result.stoppedSince;
        previousSampleRef.current = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp || Date.now(),
        };

        let updatedTrackedCar = result.car;

        if (result.justParked) {
          updatedTrackedCar = enrichCarWithParkingLot(
            updatedTrackedCar,
            updatedTrackedCar.parkedLocation,
            parkingLotsRef.current
          );

          parkingSessionRef.current = {
            parkedAt: updatedTrackedCar.parkedAt,
            parkedLotId: updatedTrackedCar.parkedLotId,
            parkedLotName: updatedTrackedCar.parkedLotName,
            parkedLotAddress: updatedTrackedCar.parkedLotAddress,
            parkedLotRate: updatedTrackedCar.parkedLotRate,
          };

          carToPersist = updatedTrackedCar;
        }

        if (result.justStartedDriving && parkingSessionRef.current?.parkedAt) {
          historyEntryToAppend = {
            car: {
              ...updatedTrackedCar,
              parkedAt: parkingSessionRef.current.parkedAt,
              parkedLotId: parkingSessionRef.current.parkedLotId,
              parkedLotName: parkingSessionRef.current.parkedLotName,
              parkedLotAddress: parkingSessionRef.current.parkedLotAddress,
              parkedLotRate: parkingSessionRef.current.parkedLotRate,
              parkedLocation: trackedCar.parkedLocation,
            },
            parkedAt: parkingSessionRef.current.parkedAt,
            coordinate: trackedCar.parkedLocation,
          };
          parkingSessionRef.current = null;
        }

        const nextCars = previousCars.map((car) => {
          if (String(car.id) !== String(trackedCarId)) {
            return {
              ...car,
              isCurrentVehicle: false,
            };
          }

          return {
            ...updatedTrackedCar,
            isCurrentVehicle: true,
          };
        });

        persistCarStates(nextCars, trackedCarId);
        return nextCars;
      });

      if (carToPersist) {
        await persistParkedLocation(carToPersist);
      }

      if (historyEntryToAppend) {
        const matchedLot = historyEntryToAppend.car.parkedLotName
          ? {
              id: historyEntryToAppend.car.parkedLotId,
              name: historyEntryToAppend.car.parkedLotName,
              address: historyEntryToAppend.car.parkedLotAddress,
              ratePerHour: historyEntryToAppend.car.parkedLotRate,
            }
          : null;

        const address =
          matchedLot?.address ||
          (await reverseGeocodeAddress(
            historyEntryToAppend.coordinate
          ));

        await appendHistoryEntry(
          buildParkingHistoryEntry({
            car: historyEntryToAppend.car,
            parkedAt: historyEntryToAppend.parkedAt,
            parkingLot: matchedLot,
            address,
          })
        );
      }
    },
    [
      appendHistoryEntry,
      persistCarStates,
      persistParkedLocation,
      setCars,
      trackedCarId,
    ]
  );

  const startTracking = useCallback(async () => {
    if (!enabled || !trackedCarId) {
      return undefined;
    }

    const foregroundPermission =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundPermission.status !== 'granted') {
      Alert.alert(
        'Location needed',
        'Allow location access so IntelliPark can detect when you are driving or parked.'
      );
      return undefined;
    }

    await Location.requestBackgroundPermissionsAsync().catch(() => {});

    subscriptionRef.current?.remove?.();

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: TRACKING_CONFIG.MIN_DISTANCE_METERS * 100,
        distanceInterval: TRACKING_CONFIG.MIN_DISTANCE_METERS,
      },
      (location) => {
        handleLocationSample(location);
      }
    );

    return () => {
      subscriptionRef.current?.remove?.();
      subscriptionRef.current = null;
    };
  }, [enabled, handleLocationSample, trackedCarId]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const bootstrap = async () => {
      const [savedTrackedCarId, savedStates, savedHistory, lots] =
        await Promise.all([
          loadTrackedCarId(),
          loadCarTrackingStates(),
          loadParkingHistory(),
          loadKnownParkingLots(),
        ]);

      if (cancelled) {
        return;
      }

      parkingLotsRef.current = lots;
      setHistory(savedHistory);

      setCars((previousCars) => {
        const restoredCars = previousCars.map((car) =>
          applyStoredTrackingState(car, savedStates)
        );

        const fallbackTrackedCarId =
          savedTrackedCarId || restoredCars[0]?.id || null;

        setTrackedCarId(fallbackTrackedCarId);

        return enrichAllCarsWithParkingLots(
          restoredCars.map((car) => {
            const isTracked =
              String(car.id) === String(fallbackTrackedCarId);

            return {
              ...car,
              isCurrentVehicle: isTracked,
              status: car.status || CAR_STATUS.PARKED,
              parkedAt:
                car.parkedAt ||
                (car.status === CAR_STATUS.PARKED &&
                car.parkedLocation
                  ? new Date().toISOString()
                  : null),
            };
          }),
          lots
        );
      });

      setTrackingReady(true);
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [enabled, setCars, setHistory]);

  useEffect(() => {
    if (!trackingReady || !trackedCarId) {
      return undefined;
    }

    let cleanup = () => {};

    startTracking().then((stop) => {
      cleanup = stop || (() => {});
    });

    return () => {
      cleanup();
    };
  }, [startTracking, trackedCarId, trackingReady]);

  const trackCar = useCallback(
    async (carId) => {
      const nextTrackedCarId = String(carId);
      setTrackedCarId(nextTrackedCarId);
      await saveTrackedCarId(nextTrackedCarId);

      setCars((previousCars) =>
        previousCars.map((car) => ({
          ...car,
          isCurrentVehicle: String(car.id) === nextTrackedCarId,
        }))
      );
    },
    [setCars]
  );

  const syncTrackedCarFromBluetooth = useCallback(async () => {
    const connectedDeviceName = await getConnectedCarBluetoothDeviceName();

    if (!connectedDeviceName) {
      return;
    }

    const matchedCar = findCarForBluetoothDevice(
      carsRef.current,
      connectedDeviceName
    );

    if (
      matchedCar &&
      String(matchedCar.id) !== String(trackedCarIdRef.current)
    ) {
      await trackCar(matchedCar.id);
    }
  }, [trackCar]);

  useEffect(() => {
    if (!enabled || !trackingReady) {
      return undefined;
    }

    syncTrackedCarFromBluetooth();

    const unsubscribeRoute = subscribeToBluetoothRouteChanges(() => {
      syncTrackedCarFromBluetooth();
    });

    const intervalId = setInterval(syncTrackedCarFromBluetooth, 8000);

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') {
          syncTrackedCarFromBluetooth();
        }
      }
    );

    return () => {
      unsubscribeRoute();
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [enabled, syncTrackedCarFromBluetooth, trackingReady]);

  return {
    trackedCarId,
    trackCar,
    trackingReady,
  };
}
