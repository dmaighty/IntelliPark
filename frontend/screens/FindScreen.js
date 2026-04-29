import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { globalStyles } from '../styles/global';
import { defaultGarages } from '../data/defaultGarages';
import FindMap from '../components/find/FindMap';
import FindDrawer from '../components/find/FindDrawer';
import GarageInfoModal from '../components/find/GarageInfoModal';
import {
  DEFAULT_COORDS,
  getTop5ClosestGarages,
  getOffsetRegion,
  buildDirectionsUrl,
} from '../utils/findUtils';
import {
  FULL_OFFSET,
  MID_OFFSET,
  COLLAPSED_OFFSET,
} from '../constants/findDrawer';

export default function FindScreen({
  tabBarHeight = 100,
  carLocation = null,
  carName = 'Your Car',
}) {
  const mapRef = useRef(null);
  const translateY = useRef(new Animated.Value(COLLAPSED_OFFSET)).current;
  const currentOffset = useRef(COLLAPSED_OFFSET);
  const searchTimeoutRef = useRef(null);

  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [searchPin, setSearchPin] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState(defaultGarages[0]?.id || null);
  const [infoGarage, setInfoGarage] = useState(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: carLocation?.latitude || DEFAULT_COORDS.latitude,
    longitude: carLocation?.longitude || DEFAULT_COORDS.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        const granted = status === 'granted';
        setLocationGranted(granted);

        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({});
        if (!mounted) return;

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);

        const fitPoints = [];
        if (coords) fitPoints.push(coords);
        if (carLocation) fitPoints.push(carLocation);

        if (fitPoints.length >= 2 && mapRef.current) {
          mapRef.current.fitToCoordinates(fitPoints, {
            edgePadding: {
              top: 100,
              right: 70,
              bottom: 260,
              left: 70,
            },
            animated: true,
          });
        }
      } catch (error) {
        setLocationGranted(false);
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, [carLocation]);

  const referencePoint = searchPin || userLocation || carLocation || DEFAULT_COORDS;

  const top5Garages = useMemo(() => {
    return getTop5ClosestGarages(referencePoint, defaultGarages);
  }, [referencePoint]);

  const selectedGarage =
    top5Garages.find((spot) => spot.id === selectedSpotId) ||
    top5Garages[0] ||
    null;

  useEffect(() => {
    if (top5Garages.length > 0 && !top5Garages.some((g) => g.id === selectedSpotId)) {
      setSelectedSpotId(top5Garages[0].id);
    }
  }, [top5Garages, selectedSpotId]);

  const animateDrawer = (toValue) => {
    currentOffset.current = toValue;

    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
    }).start();
  };

  const expandDrawer = () => animateDrawer(FULL_OFFSET);
  const expandHalfDrawer = () => animateDrawer(MID_OFFSET);
  const collapseDrawer = () => animateDrawer(COLLAPSED_OFFSET);

  const focusGarage = (garage) => {
    setSelectedSpotId(garage.id);
    expandDrawer();

    const nextRegion = getOffsetRegion(garage, 0.008, 0.008);
    setMapRegion(nextRegion);

    if (mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 280);
    }
  };

  const handleNearMe = () => {
    if (!mapRef.current) return;

    const fitPoints = [];
    if (userLocation) fitPoints.push(userLocation);
    if (carLocation) fitPoints.push(carLocation);

    if (fitPoints.length >= 2) {
      mapRef.current.fitToCoordinates(fitPoints, {
        edgePadding: {
          top: 100,
          right: 70,
          bottom: 260,
          left: 70,
        },
        animated: true,
      });
      return;
    }

    const target = userLocation || carLocation;
    if (!target) return;

    const nextRegion = getOffsetRegion(target, 0.012, 0.012);
    setMapRegion(nextRegion);
    mapRef.current.animateToRegion(nextRegion, 280);
  };

  const handleSearchAddress = async (text) => {
    const trimmed = text.trim();

    if (trimmed.length < 3) {
      setSearchPin(null);
      return;
    }

    try {
      setIsSearching(true);
      const results = await Location.geocodeAsync(trimmed);

      if (!results.length) {
        setSearchPin(null);
        return;
      }

      const first = results[0];
      const coords = {
        latitude: first.latitude,
        longitude: first.longitude,
      };

      setSearchPin(coords);

      const nearestTop5 = getTop5ClosestGarages(coords, defaultGarages);

      if (nearestTop5.length > 0) {
        setSelectedSpotId(nearestTop5[0].id);
      }

      expandHalfDrawer();

      if (mapRef.current && nearestTop5.length > 0) {
        mapRef.current.fitToCoordinates(
          [
            coords,
            ...nearestTop5.map((garage) => ({
              latitude: garage.latitude,
              longitude: garage.longitude,
            })),
          ],
          {
            edgePadding: {
              top: 120,
              right: 70,
              bottom: 260,
              left: 70,
            },
            animated: true,
          }
        );
      } else if (mapRef.current) {
        const nextRegion = getOffsetRegion(coords, 0.01, 0.01);
        setMapRegion(nextRegion);
        mapRef.current.animateToRegion(nextRegion, 300);
      }
    } catch (error) {
      setSearchPin(null);
      Alert.alert('Search error', 'Could not find that address.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      setSearchPin(null);
      return undefined;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearchAddress(query);
    }, 450);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleGo = async (garage) => {
    try {
      await Linking.openURL(buildDirectionsUrl(garage));
    } catch (error) {
      Alert.alert('Unable to open maps', 'Please try again.');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 4,

      onPanResponderMove: (_, gesture) => {
        const nextValue = Math.max(
          FULL_OFFSET,
          Math.min(COLLAPSED_OFFSET, currentOffset.current + gesture.dy)
        );
        translateY.setValue(nextValue);
      },

      onPanResponderRelease: (_, gesture) => {
        const nextValue = Math.max(
          FULL_OFFSET,
          Math.min(COLLAPSED_OFFSET, currentOffset.current + gesture.dy)
        );

        const isNear = (value, target, threshold = 30) =>
          Math.abs(value - target) <= threshold;

        if (gesture.dy < -40) {
          if (isNear(currentOffset.current, COLLAPSED_OFFSET)) {
            animateDrawer(MID_OFFSET);
            return;
          }

          if (isNear(currentOffset.current, MID_OFFSET)) {
            animateDrawer(FULL_OFFSET);
            return;
          }

          animateDrawer(FULL_OFFSET);
          return;
        }

        if (gesture.dy > 40) {
          if (isNear(currentOffset.current, FULL_OFFSET)) {
            animateDrawer(MID_OFFSET);
            return;
          }

          if (isNear(currentOffset.current, MID_OFFSET)) {
            animateDrawer(COLLAPSED_OFFSET);
            return;
          }

          animateDrawer(COLLAPSED_OFFSET);
          return;
        }

        const snapPoints = [FULL_OFFSET, MID_OFFSET, COLLAPSED_OFFSET];

        const nearestPoint = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - nextValue) < Math.abs(prev - nextValue) ? curr : prev
        );

        animateDrawer(nearestPoint);
      },
    })
  ).current;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.screenContent}>
        <FindMap
          mapRef={mapRef}
          mapRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          initialRegion={{
            latitude: carLocation?.latitude || DEFAULT_COORDS.latitude,
            longitude: carLocation?.longitude || DEFAULT_COORDS.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          locationGranted={locationGranted}
          carLocation={carLocation}
          carName={carName}
          searchPin={searchPin}
          query={query}
          garages={top5Garages}
          selectedSpotId={selectedSpotId}
          onSelectGarage={focusGarage}
          onNearMe={handleNearMe}
        />

        <FindDrawer
          tabBarHeight={tabBarHeight}
          translateY={translateY}
          panHandlers={panResponder.panHandlers}
          query={query}
          onChangeQuery={setQuery}
          onSubmitSearch={() => handleSearchAddress(query)}
          isSearching={isSearching}
          onFocusSearch={expandHalfDrawer}
          selectedGarage={selectedGarage}
          referencePoint={referencePoint}
          onGo={handleGo}
          onMoreInfo={setInfoGarage}
          garages={top5Garages}
          selectedSpotId={selectedSpotId}
          onSelectGarage={focusGarage}
        />
      </View>

      <GarageInfoModal
        visible={!!infoGarage}
        garage={infoGarage}
        userLocation={userLocation}
        onClose={() => setInfoGarage(null)}
        onDirections={handleGo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
});