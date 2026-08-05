import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { globalStyles } from '../styles/global';
import { getParkingLots } from '../api/parking_lots';
import FindMap from '../components/find/FindMap';
import FindDrawer from '../components/find/FindDrawer';
import GarageInfoModal from '../components/find/GarageInfoModal';
import PlaceInfoModal from '../components/find/PlaceInfoModal';
import GarageLotLiveScreen from '../components/find/GarageLotLiveScreen';
import {
  DEFAULT_COORDS,
  sortGaragesByDistance,
  getOffsetRegion,
  buildDirectionsUrl,
  buildDirectionsUrlForPoint,
  mapParkingLotApiToGarage,
} from '../utils/findUtils';
import { openWalkingDirections } from '../utils/navigationUtils';
import { rankGaragesForUser } from '../utils/garagePredictionUtils';
import { hydrateCars } from '../utils/carUtils';
import { loadSavedPlaces, getConfiguredSavedPlaces, hasConfiguredSavedPlaces } from '../utils/savedPlaces';
import {
  isGarageSaved,
  loadSavedGarages,
  toggleSavedGarage,
} from '../utils/savedGarages';
import {
  addNavigationRecent,
  loadNavigationRecents,
} from '../utils/navigationRecents';
import {
  loadPlaceDetails,
  searchPlaces,
} from '../utils/placesSearch';
import {
  FULL_OFFSET,
  MID_OFFSET,
  COLLAPSED_OFFSET,
} from '../constants/findDrawer';

export default function FindScreen({
  tabBarHeight = 100,
  cars = [],
  trackedCarId = null,
  savedPlacesRefreshTrigger = 0,
  savedGaragesRefreshTrigger = 0,
  onAddSavedPlaces,
}) {
  const mapRef = useRef(null);
  const translateY = useRef(new Animated.Value(COLLAPSED_OFFSET)).current;
  const currentOffset = useRef(COLLAPSED_OFFSET);
  const searchTimeoutRef = useRef(null);
  const hasAutoFocusedRef = useRef(false);

  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [garages, setGarages] = useState([]);
  const [lotsError, setLotsError] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [infoGarage, setInfoGarage] = useState(null);
  const [infoPlace, setInfoPlace] = useState(null);
  const [garageLotLiveVisible, setGarageLotLiveVisible] = useState(false);
  const [liveViewGarage, setLiveViewGarage] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [hasSavedPlaces, setHasSavedPlaces] = useState(false);
  const [savedGarages, setSavedGarages] = useState([]);
  const [recents, setRecents] = useState([]);

  const mappedCars = useMemo(() => hydrateCars(cars), [cars]);

  const recentlyParkedCar = useMemo(() => {
    const tracked = mappedCars.find(
      (car) => String(car.id) === String(trackedCarId)
    );

    if (tracked?.status === 'parked' && tracked?.parkedLocation) {
      return tracked;
    }

    const parkedCars = mappedCars
      .filter(
        (car) =>
          car.status === 'parked' && car.parkedAt && car.parkedLocation
      )
      .sort(
        (a, b) =>
          new Date(b.parkedAt).getTime() - new Date(a.parkedAt).getTime()
      );

    return parkedCars[0] || null;
  }, [mappedCars, trackedCarId]);

  useEffect(() => {
    let cancelled = false;

    const loadLots = async () => {
      setLotsError('');
      try {
        const rows = await getParkingLots();
        if (cancelled) return;
        const mapped = rows
          .filter((row) => row != null)
          .map(mapParkingLotApiToGarage);
        setGarages(mapped);
      } catch (error) {
        if (!cancelled) {
          setLotsError(error.message || 'Could not load parking lots');
          setGarages([]);
        }
      }
    };

    loadLots();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const [places, recentItems] = await Promise.all([
        loadSavedPlaces(),
        loadNavigationRecents(),
      ]);

      if (!mounted) {
        return;
      }

      setSavedPlaces(getConfiguredSavedPlaces(places));
      setHasSavedPlaces(hasConfiguredSavedPlaces(places));
      setRecents(recentItems);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [savedPlacesRefreshTrigger]);

  useEffect(() => {
    let mounted = true;

    const loadFavorites = async () => {
      const favorites = await loadSavedGarages();

      if (mounted) {
        setSavedGarages(favorites);
      }
    };

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [savedGaragesRefreshTrigger]);

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

  const resolveUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationGranted(false);
        return userLocation;
      }

      setLocationGranted(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      return coords;
    } catch {
      return userLocation;
    }
  }, [userLocation]);

  const focusOnUserLocation = useCallback(async () => {
    const coords = await resolveUserLocation();

    if (!coords) {
      Alert.alert(
        'Location unavailable',
        'Allow location access so IntelliPark can center the map on you.'
      );
      return null;
    }

    const nextRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 350);
    }

    return coords;
  }, [resolveUserLocation]);

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        const granted = status === 'granted';
        setLocationGranted(granted);
        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch {
        if (mounted) {
          setLocationGranted(false);
        }
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const referencePoint = selectedPlace || userLocation || DEFAULT_COORDS;

  const rankedGarages = useMemo(() => {
    return rankGaragesForUser(referencePoint, garages);
  }, [referencePoint, garages]);

  useEffect(() => {
    if (hasAutoFocusedRef.current || !mapReady || !userLocation) {
      return;
    }

    hasAutoFocusedRef.current = true;

    focusOnUserLocation();

    const nearestToUser = sortGaragesByDistance(userLocation, garages).slice(
      0,
      5
    );

    if (nearestToUser.length > 0) {
      setSelectedSpotId(nearestToUser[0].id);
    }

    expandHalfDrawer();
  }, [focusOnUserLocation, garages, mapReady, userLocation]);

  const selectedGarage =
    sortedGarages.find((spot) => spot.id === selectedSpotId) ||
    sortedGarages[0] ||
    null;

  useEffect(() => {
    if (
      sortedGarages.length > 0 &&
      !sortedGarages.some((garage) => garage.id === selectedSpotId)
    ) {
      setSelectedSpotId(sortedGarages[0].id);
    }
  }, [sortedGarages, selectedSpotId]);

  const focusMapOnCoordinate = useCallback((coordinate) => {
    if (!coordinate || !mapRef.current) {
      return;
    }

    const nextRegion = getOffsetRegion(coordinate, 0.01, 0.01);
    mapRef.current.animateToRegion(nextRegion, 280);
  }, []);

  const focusGarage = (garage) => {
    setSelectedSpotId(garage.id);
    setSelectedCarId(null);
    setSelectedPlace(null);
    expandDrawer();
    focusMapOnCoordinate(garage);
  };

  const focusCar = useCallback(
    (car) => {
      if (!car?.parkedLocation) {
        return;
      }

      setSelectedCarId(car.id);
      setSelectedSpotId(null);
      setSelectedPlace(null);
      collapseDrawer();
      focusMapOnCoordinate(car.parkedLocation);
    },
    [focusMapOnCoordinate]
  );

  const focusPlace = useCallback(
    async (place) => {
      if (!place?.latitude || !place?.longitude) {
        return;
      }

      const detailed = await loadPlaceDetails(place);
      setSelectedPlace(detailed);
      setSelectedSpotId(null);
      setSelectedCarId(null);
      setInfoGarage(null);
      expandHalfDrawer();
      focusMapOnCoordinate(detailed);
    },
    [focusMapOnCoordinate]
  );

  const handleNearMe = async () => {
    setQuery('');
    setSearchResults([]);
    setSelectedPlace(null);
    setSelectedCarId(null);

    const coords = await focusOnUserLocation();

    if (!coords) {
      return;
    }

    const nearestToUser = sortGaragesByDistance(coords, garages).slice(0, 5);

    if (nearestToUser.length > 0) {
      setSelectedSpotId(nearestToUser[0].id);
    }

    expandHalfDrawer();
  };

  const handleSearch = useCallback(
    async (text) => {
      const trimmed = text.trim();

      if (trimmed.length < 3) {
        setSearchResults([]);
        setSelectedPlace(null);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchPlaces(
          trimmed,
          userLocation || DEFAULT_COORDS
        );
        setSearchResults(results);

        if (results.length > 0) {
          await focusPlace(results[0]);
        } else {
          setSelectedPlace(null);
        }
      } catch {
        setSearchResults([]);
        Alert.alert('Search error', 'Could not search for that place.');
      } finally {
        setIsSearching(false);
      }
    },
    [focusPlace, userLocation]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      setSearchResults([]);
      return undefined;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 450);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, handleSearch]);

  const recordRecent = useCallback(async (target) => {
    const next = await addNavigationRecent({
      id: target.id,
      name: target.name || target.title,
      address: target.address,
      category: target.category,
      latitude: target.latitude,
      longitude: target.longitude,
    });

    if (next) {
      setRecents(next);
    }
  }, []);

  const handleGoToTarget = async (target) => {
    if (!target?.latitude || !target?.longitude) {
      return;
    }

    await recordRecent(target);

    try {
      await Linking.openURL(
        buildDirectionsUrlForPoint(target.latitude, target.longitude)
      );
    } catch {
      Alert.alert('Unable to open maps', 'Please try again.');
    }
  };

  const handleGoGarage = async (garage) => {
    await recordRecent({
      id: garage.id,
      name: garage.name,
      address: garage.address,
      category: 'Parking',
      latitude: garage.latitude,
      longitude: garage.longitude,
    });

    try {
      await Linking.openURL(buildDirectionsUrl(garage));
    } catch {
      Alert.alert('Unable to open maps', 'Please try again.');
    }
  };

  const handleToggleFavorite = useCallback(async (garage) => {
    const updated = await toggleSavedGarage(garage);
    setSavedGarages(updated);
  }, []);

  const handleAvailabilityChange = useCallback((lotId, spotsOpen) => {
    const update = (garage) =>
      garage?.id === String(lotId) ? { ...garage, spotsOpen } : garage;

    setGarages((current) => current.map(update));
    setInfoGarage((current) => update(current));
    setLiveViewGarage((current) => update(current));
  }, []);

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

  const mapSearchPlaces = selectedPlace
    ? [selectedPlace, ...searchResults.filter((place) => place.id !== selectedPlace.id)]
    : searchResults;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.screenContent}>
        {!!lotsError && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{lotsError}</Text>
          </View>
        )}
        <FindMap
          mapRef={mapRef}
          onRegionChangeComplete={() => {}}
          onMapReady={() => setMapReady(true)}
          initialRegion={{
            latitude: DEFAULT_COORDS.latitude,
            longitude: DEFAULT_COORDS.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          locationGranted={locationGranted}
          recentlyParkedCar={recentlyParkedCar}
          selectedCarId={selectedCarId}
          searchPlaces={mapSearchPlaces}
          selectedPlaceId={selectedPlace?.id}
          garages={sortedGarages}
          selectedSpotId={selectedSpotId}
          onSelectGarage={focusGarage}
          onSelectCar={focusCar}
          onSelectSearchPlace={focusPlace}
          onNearMe={handleNearMe}
        />

        <FindDrawer
          tabBarHeight={tabBarHeight}
          translateY={translateY}
          panHandlers={panResponder.panHandlers}
          query={query}
          onChangeQuery={setQuery}
          onSubmitSearch={() => handleSearch(query)}
          isSearching={isSearching}
          onFocusSearch={expandHalfDrawer}
          selectedGarage={selectedGarage}
          selectedPlace={selectedPlace}
          referencePoint={referencePoint}
          onGo={(target) =>
            target?.ratePerHour != null || target?.spotsOpen != null
              ? handleGoGarage(target)
              : handleGoToTarget(target)
          }
          onMoreInfo={setInfoGarage}
          onMorePlaceInfo={setInfoPlace}
          garages={sortedGarages}
          selectedSpotId={selectedSpotId}
          onSelectGarage={focusGarage}
          recentlyParkedCar={recentlyParkedCar}
          onSelectCar={focusCar}
          onNavigateToParkedCar={openWalkingDirections}
          savedPlaces={savedPlaces}
          hasSavedPlaces={hasSavedPlaces}
          onAddSavedPlaces={onAddSavedPlaces}
          onSelectSavedPlace={focusPlace}
          searchResults={searchResults}
          onSelectSearchResult={focusPlace}
          recents={recents}
          onSelectRecent={focusPlace}
        />
      </View>

      <GarageInfoModal
        visible={!!infoGarage}
        garage={infoGarage}
        userLocation={userLocation}
        isSaved={isGarageSaved(infoGarage?.id, savedGarages)}
        onClose={() => setInfoGarage(null)}
        onDirections={handleGoGarage}
        onToggleFavorite={handleToggleFavorite}
        onAvailabilityChange={handleAvailabilityChange}
        onGarageLotPage={() => {
          setLiveViewGarage(infoGarage);
          setInfoGarage(null);
          setGarageLotLiveVisible(true);
        }}
      />

      <PlaceInfoModal
        visible={!!infoPlace}
        place={infoPlace}
        userLocation={userLocation}
        onClose={() => setInfoPlace(null)}
        onDirections={handleGoToTarget}
      />

      <GarageLotLiveScreen
        visible={garageLotLiveVisible}
        garage={liveViewGarage}
        onAvailabilityChange={handleAvailabilityChange}
        onClose={() => {
          setGarageLotLiveVisible(false);
          setLiveViewGarage(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
  },

  bannerText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
});
