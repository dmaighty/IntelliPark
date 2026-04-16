import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { globalStyles, radius, shadow } from '../styles/global';

const { height } = Dimensions.get('window');

const DEFAULT_COORDS = {
  latitude: 37.3352,
  longitude: -121.8811,
};

const NEARBY_GARAGES = [
  {
    id: '1',
    name: 'South Garage',
    address: '330 S 7th St, San Jose, CA',
    latitude: 37.3328,
    longitude: -121.8806,
    rating: 4.6,
    ratePerHour: '$4/hr',
    spotsOpen: 42,
    details:
      'Student-friendly garage close to the south side of campus. Covered parking with elevator access.',
  },
  {
    id: '2',
    name: 'West Garage',
    address: '355 S 4th St, San Jose, CA',
    latitude: 37.3342,
    longitude: -121.8851,
    rating: 4.4,
    ratePerHour: '$5/hr',
    spotsOpen: 18,
    details:
      'Close to downtown and west campus buildings. Good for short stays and events.',
  },
  {
    id: '3',
    name: 'North Garage',
    address: '225 E Santa Clara St, San Jose, CA',
    latitude: 37.3376,
    longitude: -121.8831,
    rating: 4.7,
    ratePerHour: '$6/hr',
    spotsOpen: 9,
    details:
      'Premium garage with quick access to the north side of SJSU and Santa Clara Street.',
  },
  {
    id: '4',
    name: '10th Street Garage',
    address: '127 S 10th St, San Jose, CA',
    latitude: 37.3348,
    longitude: -121.8738,
    rating: 4.3,
    ratePerHour: '$3/hr',
    spotsOpen: 27,
    details:
      'Budget-friendly parking with easy entry and exit near east campus.',
  },
  {
    id: '5',
    name: 'San Pedro Square Garage',
    address: '45 N Market St, San Jose, CA',
    latitude: 37.3364,
    longitude: -121.8949,
    rating: 4.8,
    ratePerHour: '$7/hr',
    spotsOpen: 31,
    details:
      'Popular downtown option with lots of dining nearby. Best for mixed campus and downtown visits.',
  },
];

const DRAWER_HEIGHT = height * 0.88;
const COLLAPSED_VISIBLE_HEIGHT = 52;
const MID_VISIBLE_HEIGHT = height * 0.45;
const FULL_VISIBLE_HEIGHT = height * 0.82;

const FULL_OFFSET = DRAWER_HEIGHT - FULL_VISIBLE_HEIGHT;
const MID_OFFSET = DRAWER_HEIGHT - MID_VISIBLE_HEIGHT;
const COLLAPSED_OFFSET = DRAWER_HEIGHT - COLLAPSED_VISIBLE_HEIGHT;

const getDistanceMiles = (a, b) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusMiles * c;
};

const buildDirectionsUrl = (garage) => {
  const destination = `${garage.latitude},${garage.longitude}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

const getTop5ClosestGarages = (point) => {
  return [...NEARBY_GARAGES]
    .sort((a, b) => {
      const distanceA = getDistanceMiles(point, a);
      const distanceB = getDistanceMiles(point, b);
      return distanceA - distanceB;
    })
    .slice(0, 5);
};

const getOffsetRegion = (
  coordinate,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01
) => ({
  latitude: coordinate.latitude - latitudeDelta * 0.28,
  longitude: coordinate.longitude,
  latitudeDelta,
  longitudeDelta,
});

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
  const [selectedSpotId, setSelectedSpotId] = useState(NEARBY_GARAGES[0].id);
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
    return getTop5ClosestGarages(referencePoint);
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

      const nearestTop5 = getTop5ClosestGarages(coords);

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
      } else {
        const nextRegion = getOffsetRegion(coords, 0.01, 0.01);
        setMapRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 300);
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
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          initialRegion={{
            latitude: carLocation?.latitude || DEFAULT_COORDS.latitude,
            longitude: carLocation?.longitude || DEFAULT_COORDS.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation={locationGranted}
        >
          {carLocation && (
            <Marker
              coordinate={carLocation}
              title={carName}
              description="Saved parked location"
              pinColor="black"
            />
          )}

          {searchPin && (
            <Marker
              coordinate={searchPin}
              title="Search result"
              description={query.trim() || 'Searched location'}
              pinColor="red"
            />
          )}

          {top5Garages.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.latitude,
                longitude: spot.longitude,
              }}
              title={spot.name}
              description={spot.address}
              pinColor={selectedSpotId === spot.id ? 'green' : undefined}
              onPress={() => focusGarage(spot)}
            />
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.nearMeButton}
          onPress={handleNearMe}
          activeOpacity={0.85}
        >
          <Text style={styles.nearMeText}>Find Me</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.drawer,
            {
              bottom: tabBarHeight - 2,
              height: DRAWER_HEIGHT,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.drawerHeaderDragArea}>
            <View style={styles.drawerHandleArea}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search here"
                placeholderTextColor="#777"
                value={query}
                onChangeText={setQuery}
                onFocus={expandHalfDrawer}
                onSubmitEditing={() => handleSearchAddress(query)}
                returnKeyType="search"
              />
              {isSearching && <Text style={styles.searchingText}>Searching…</Text>}
            </View>
          </View>

          <View style={styles.expandedContent}>
            {selectedGarage && (
              <View style={styles.selectedGarageCard}>
                <Text style={styles.selectedGarageName}>{selectedGarage.name}</Text>
                <Text style={styles.selectedGarageAddress}>
                  {selectedGarage.address}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>★ {selectedGarage.rating}</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>{selectedGarage.ratePerHour}</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>
                      {selectedGarage.spotsOpen} open
                    </Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statLabel}>
                      {getDistanceMiles(referencePoint, selectedGarage).toFixed(1)} mi
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.goButton}
                    activeOpacity={0.85}
                    onPress={() => handleGo(selectedGarage)}
                  >
                    <Text style={styles.goButtonText}>Go</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.moreInfoButton}
                    activeOpacity={0.85}
                    onPress={() => setInfoGarage(selectedGarage)}
                  >
                    <Text style={styles.moreInfoText}>More info</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionTitle}>Top 5 nearby garages</Text>

              {top5Garages.map((spot) => {
                const isSelected = selectedSpotId === spot.id;

                return (
                  <TouchableOpacity
                    key={spot.id}
                    style={[
                      styles.resultCard,
                      isSelected && styles.resultCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => focusGarage(spot)}
                  >
                    <View style={styles.resultTopRow}>
                      <View style={styles.resultTextBlock}>
                        <Text style={styles.resultName}>{spot.name}</Text>
                        <Text style={styles.resultAddress}>{spot.address}</Text>
                      </View>
                      <Text style={styles.resultDistance}>
                        {getDistanceMiles(referencePoint, spot).toFixed(1)} mi
                      </Text>
                    </View>

                    <View style={styles.resultStatsInline}>
                      <Text style={styles.resultMeta}>★ {spot.rating}</Text>
                      <Text style={styles.resultMeta}>{spot.ratePerHour}</Text>
                      <Text style={styles.resultMeta}>{spot.spotsOpen} open</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={!!infoGarage}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoGarage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{infoGarage?.name}</Text>
            <Text style={styles.modalAddress}>{infoGarage?.address}</Text>

            <View style={styles.modalStatBlock}>
              <Text style={styles.modalStat}>Review Rating: {infoGarage?.rating}</Text>
              <Text style={styles.modalStat}>Rate: {infoGarage?.ratePerHour}</Text>
              <Text style={styles.modalStat}>Spots Open: {infoGarage?.spotsOpen}</Text>
            </View>

            <Text style={styles.modalDetails}>{infoGarage?.details}</Text>

            <TouchableOpacity
              style={styles.modalGoButton}
              activeOpacity={0.85}
              onPress={() => infoGarage && handleGo(infoGarage)}
            >
              <Text style={styles.modalGoButtonText}>Go</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              activeOpacity={0.85}
              onPress={() => setInfoGarage(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  nearMeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.medium,
    ...shadow.soft,
  },

  nearMeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    ...shadow.card,
  },

  drawerHeaderDragArea: {
    paddingBottom: 6,
  },

  drawerHandleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },

  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
  },

  searchWrap: {
    marginHorizontal: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  searchInput: {
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },

  searchingText: {
    position: 'absolute',
    right: 14,
    top: 17,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  expandedContent: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 20,
  },

  selectedGarageCard: {
    marginHorizontal: 14,
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  selectedGarageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },

  selectedGarageAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },

  statPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 12,
    color: '#111',
    fontWeight: '600',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  goButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  moreInfoButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreInfoText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },

  resultsList: {
    flex: 1,
    paddingHorizontal: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },

  resultCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  resultCardSelected: {
    backgroundColor: '#eceff3',
  },

  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  resultTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  resultAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  resultDistance: {
    fontSize: 12,
    color: '#444',
    fontWeight: '700',
  },

  resultStatsInline: {
    flexDirection: 'row',
    marginTop: 10,
  },

  resultMeta: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
    marginRight: 12,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },

  modalAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  modalStatBlock: {
    marginBottom: 16,
  },

  modalStat: {
    fontSize: 15,
    color: '#111',
    fontWeight: '600',
    marginBottom: 8,
  },

  modalDetails: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
    marginBottom: 20,
  },

  modalGoButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  modalGoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  modalCloseButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
});