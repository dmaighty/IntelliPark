import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export default function useLocationPermission() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        const granted = status === 'granted';
        setLocationGranted(granted);

        if (!granted) {
          setUserLocation(null);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        if (!isMounted) return;

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        if (!isMounted) return;
        setLocationGranted(false);
        setUserLocation(null);
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    locationGranted,
    userLocation,
  };
}