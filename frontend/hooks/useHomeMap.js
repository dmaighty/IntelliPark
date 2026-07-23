import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildRegion,
  CAR_CENTER_OFFSET,
  CAR_VIEW_ZOOM,
  DEFAULT_COORDS,
  FOCUSED_LAT_DELTA,
  FOCUSED_LNG_DELTA,
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

  const focusMapOnCoordinate = useCallback(
    (
      coordinate,
      {
        offset = CAR_CENTER_OFFSET,
        latitudeDelta = FOCUSED_LAT_DELTA,
        longitudeDelta = FOCUSED_LNG_DELTA,
        zoom = CAR_VIEW_ZOOM,
        animated = true,
      } = {}
    ) => {
      if (!coordinate || !mapRef.current || !mapReady) return;

      const centeredCoordinate = {
        latitude: coordinate.latitude + offset,
        longitude: coordinate.longitude,
      };

      const nextRegion = buildRegion(
        centeredCoordinate,
        latitudeDelta,
        longitudeDelta
      );

      setMapRegion(nextRegion);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mapRef.current?.animateCamera(
            {
              center: centeredCoordinate,
              zoom,
            },
            { duration: animated ? 300 : 0 }
          );
        });
      });
    },
    [mapReady]
  );

  const focusMapOnCar = useCallback(
    (car, animated = true) => {
      if (!car?.parkedLocation) return;

      focusMapOnCoordinate(car.parkedLocation, {
        offset: CAR_CENTER_OFFSET,
        latitudeDelta: FOCUSED_LAT_DELTA,
        longitudeDelta: FOCUSED_LNG_DELTA,
        zoom: CAR_VIEW_ZOOM,
        animated,
      });
    },
    [focusMapOnCoordinate]
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
    if (!userLocation) return;

    focusMapOnCoordinate(userLocation, {
      offset: CAR_CENTER_OFFSET,
      latitudeDelta: FOCUSED_LAT_DELTA,
      longitudeDelta: FOCUSED_LNG_DELTA,
      zoom: CAR_VIEW_ZOOM,
      animated: true,
    });
  }, [userLocation, focusMapOnCoordinate]);

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