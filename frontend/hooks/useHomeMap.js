import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildRegion,
  CAR_CENTER_OFFSET,
  CAR_VIEW_ZOOM,
  DEFAULT_COORDS,
  FOCUSED_LAT_DELTA,
  FOCUSED_LNG_DELTA,
  USER_VIEW_LAT_DELTA,
  USER_VIEW_LNG_DELTA,
  USER_VIEW_ZOOM,
} from '../utils/mapUtils';

export default function useHomeMap({
  firstMapCoordinate,
  selectedCar,
  userLocation,
}) {
  const mapRef = useRef(null);
  const didInitialFocus = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState(
    buildRegion(firstMapCoordinate || DEFAULT_COORDS)
  );

  useEffect(() => {
    setMapRegion(buildRegion(firstMapCoordinate || DEFAULT_COORDS));
  }, [firstMapCoordinate]);

  const focusMapOnCar = useCallback(
    (car, animated = true) => {
      if (!car?.parkedLocation || !mapRef.current || !mapReady) return;

      const centeredCoordinate = {
        latitude: car.parkedLocation.latitude + CAR_CENTER_OFFSET,
        longitude: car.parkedLocation.longitude,
      };

      const nextRegion = buildRegion(
        centeredCoordinate,
        FOCUSED_LAT_DELTA,
        FOCUSED_LNG_DELTA
      );

      setMapRegion(nextRegion);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mapRef.current?.animateCamera(
            {
              center: centeredCoordinate,
              zoom: CAR_VIEW_ZOOM,
            },
            { duration: animated ? 300 : 0 }
          );
        });
      });
    },
    [mapReady]
  );

  useEffect(() => {
    if (!mapReady || !selectedCar || didInitialFocus.current) return;

    didInitialFocus.current = true;
    focusMapOnCar(selectedCar, false);
  }, [mapReady, selectedCar, focusMapOnCar]);

  const handleZoom = useCallback(
    (direction) => {
      const factor = direction === 'in' ? 0.7 : 1.4;

      const nextRegion = {
        ...mapRegion,
        latitudeDelta: Math.max(
          0.002,
          Math.min(1, mapRegion.latitudeDelta * factor)
        ),
        longitudeDelta: Math.max(
          0.002,
          Math.min(1, mapRegion.longitudeDelta * factor)
        ),
      };

      setMapRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 250);
    },
    [mapRegion]
  );

  const handleFindCar = useCallback(() => {
    if (!selectedCar) return;
    focusMapOnCar(selectedCar, true);
  }, [selectedCar, focusMapOnCar]);

  const handleFindUser = useCallback(() => {
    if (!userLocation || !mapRef.current) return;

    const nextRegion = buildRegion(
      userLocation,
      USER_VIEW_LAT_DELTA,
      USER_VIEW_LNG_DELTA
    );

    setMapRegion(nextRegion);

    mapRef.current.animateCamera(
      {
        center: userLocation,
        zoom: USER_VIEW_ZOOM,
      },
      { duration: 300 }
    );
  }, [userLocation]);

  return {
    mapRef,
    mapRegion,
    mapReady,
    setMapReady,
    setMapRegion,
    focusMapOnCar,
    handleZoom,
    handleFindCar,
    handleFindUser,
  };
}