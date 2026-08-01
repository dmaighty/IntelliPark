import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const VEHICLE_LOCATION_TASK = 'vehicle-location-task';

TaskManager.defineTask(VEHICLE_LOCATION_TASK, ({ data, error }) => {
  if (error) {
    return;
  }

  // Background samples are handled by the foreground watcher for now.
  if (Array.isArray(data?.locations) && data.locations.length > 0) {
    return;
  }
});

export async function registerBackgroundVehicleTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    VEHICLE_LOCATION_TASK
  );

  if (isRegistered) {
    return;
  }

  await Location.startLocationUpdatesAsync(VEHICLE_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
  });
}

export async function unregisterBackgroundVehicleTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    VEHICLE_LOCATION_TASK
  );

  if (!isRegistered) {
    return;
  }

  await Location.stopLocationUpdatesAsync(VEHICLE_LOCATION_TASK);
}
