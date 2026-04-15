import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Keyboard,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { globalStyles, spacing, radius, shadow } from '../styles/global';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + spacing.cardGap;

const DEFAULT_COORDS = {
  latitude: 37.3352,
  longitude: -121.8811,
};

const DEFAULT_LAT_DELTA = 0.006;
const DEFAULT_LNG_DELTA = 0.006;
const FOCUSED_LAT_DELTA = 0.0035;
const FOCUSED_LNG_DELTA = 0.0035;

const defaultCars = [
  {
    id: 1,
    year: '2024',
    title: 'Toyota Camry',
    make: 'Toyota Camry',
    licensePlate: '8ABC123',
    color: 'Black',
    colorId: 'black',
    image: require('../assets/parked-black-car.png'),
    parkedLocation: {
      latitude: 37.3356,
      longitude: -121.8810,
    },
  },
  {
    id: 2,
    year: '2023',
    title: 'Honda Civic',
    make: 'Honda Civic',
    licensePlate: '8XYZ456',
    color: 'White',
    colorId: 'white',
    image: require('../assets/parked-white-car.png'),
    parkedLocation: {
      latitude: 37.3364,
      longitude: -121.8789,
    },
  },
  {
    id: 3,
    year: '2022',
    title: 'Tesla Model 3',
    make: 'Tesla Model 3',
    licensePlate: '9TES789',
    color: 'Red',
    colorId: 'red',
    image: require('../assets/parked-red-car.png'),
    parkedLocation: {
      latitude: 37.3348,
      longitude: -121.8832,
    },
  },
];

const buildRegion = (
  coordinate,
  latitudeDelta = DEFAULT_LAT_DELTA,
  longitudeDelta = DEFAULT_LNG_DELTA
) => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta,
  longitudeDelta,
});

const getCarDisplayName = (car) => {
  if (!car) return '';
  return car.make?.trim() || car.title?.trim() || 'Untitled Car';
};

const getCarSubtitle = (car) => {
  if (!car) return '';
  return [car.year, car.make || car.title].filter(Boolean).join(' ').trim();
};

export default function HomeScreen({
  cars = defaultCars,
  onProfilePress,
  onFindPress,
  onChatPress,
  onAddCarPress,
  onEditCarPress,
  onRemoveCarPress,
  tabBarHeight = 100,
}) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const mapRef = useRef(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const initialFocusDoneRef = useRef(false);

  const visibleCars = cars.slice(0, 7);
  const carData = [...visibleCars, { id: 'add', isAddCard: true }];
  const firstMapCoordinate = visibleCars[0]?.parkedLocation || DEFAULT_COORDS;

  const [locationGranted, setLocationGranted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState(buildRegion(firstMapCoordinate));

  const [message, setMessage] = useState('');
  const [menuCar, setMenuCar] = useState(null);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);

  const selectedCar =
    visibleCars.length > 0
      ? visibleCars[Math.min(currentCarIndex, visibleCars.length - 1)]
      : null;

  useEffect(() => {
    let mounted = true;

    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (mounted) {
          setLocationGranted(status === 'granted');
        }
      } catch (error) {
        if (mounted) {
          setLocationGranted(false);
        }
      }
    };

    requestLocationPermission();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (visibleCars.length === 0) {
      setCurrentCarIndex(0);
      return;
    }

    if (currentCarIndex > visibleCars.length - 1) {
      setCurrentCarIndex(visibleCars.length - 1);
    }
  }, [visibleCars.length, currentCarIndex]);

  const focusMapOnCar = useCallback(
    (car, animated = true) => {
      if (!car?.parkedLocation || !mapRef.current || !mapReady) return;
  
      const latitudeOffset = -0.0012;
  
      const centeredCoordinate = {
        latitude: car.parkedLocation.latitude + latitudeOffset,
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
              zoom: 17,
            },
            { duration: animated ? 300 : 0 }
          );
        });
      });
    },
    [mapReady]
  );

  useEffect(() => {
    if (!mapReady || !selectedCar || initialFocusDoneRef.current) return;

    initialFocusDoneRef.current = true;
    focusMapOnCar(selectedCar, false);
  }, [mapReady, selectedCar, focusMapOnCar]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, [sheetAnim]);

  const composerBoxMinHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 98],
  });

  const composerSheetHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tabBarHeight + 96, tabBarHeight + 122],
  });

  const floatingButtonBottom = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tabBarHeight + 96, height * 0.62],
  });

  const scrollToCard = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SNAP_INTERVAL,
        animated: true,
      });
    }

    if (index >= 0 && index < visibleCars.length) {
      const car = visibleCars[index];
      setCurrentCarIndex(index);
      focusMapOnCar(car, true);
    }
  };

  const handleCardSnap = (offsetX) => {
    const snappedIndex = Math.round(offsetX / SNAP_INTERVAL);

    if (snappedIndex >= 0 && snappedIndex < visibleCars.length) {
      const car = visibleCars[snappedIndex];
      setCurrentCarIndex(snappedIndex);
      focusMapOnCar(car, true);
    }
  };

  const handleZoom = (direction) => {
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

    if (mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 250);
    }
  };

  const handleInputFocus = () => {
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start();

    onChatPress?.();
  };

  const handleEditCar = () => {
    const selectedMenuCar = menuCar;
    setMenuCar(null);
    onEditCarPress?.(selectedMenuCar);
  };

  const handleRemoveCar = () => {
    const selectedMenuCar = menuCar;
    setMenuCar(null);

    if (!selectedMenuCar) return;

    Alert.alert(
      'Remove car',
      `Remove ${getCarDisplayName(selectedMenuCar)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveCarPress?.(selectedMenuCar.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.screenContent}>
        <View style={globalStyles.headerRow}>
          <TouchableOpacity
            style={globalStyles.profileCircle}
            onPress={onProfilePress}
          >
            <Image
              source={require('../assets/profile.png')}
              style={globalStyles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.carsSection}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.carsScroll}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) =>
              handleCardSnap(event.nativeEvent.contentOffset.x)
            }
            scrollEventThrottle={16}
          >
            {carData.map((car, index) => {
              const inputRange = [
                (index - 1) * SNAP_INTERVAL,
                index * SNAP_INTERVAL,
                (index + 1) * SNAP_INTERVAL,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.96, 1, 0.96],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.82, 1, 0.82],
                extrapolate: 'clamp',
              });

              if (car.isAddCard) {
                return (
                  <Animated.View
                    key={car.id}
                    style={[
                      styles.carCard,
                      styles.addCarCard,
                      { transform: [{ scale }], opacity },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.addCarContent}
                      activeOpacity={0.9}
                      onPress={() => onAddCarPress?.()}
                    >
                      <Text style={styles.addCarPlus}>＋</Text>
                      <Text style={styles.addCarText}>Add Car</Text>
                      <Text style={styles.addCarSubtext}>Up to 7 vehicles</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              }

              return (
                <Animated.View
                  key={car.id}
                  style={[
                    styles.carCard,
                    { transform: [{ scale }], opacity },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardMenuButton}
                    activeOpacity={0.8}
                    onPress={() => setMenuCar(car)}
                  >
                    <Text style={styles.cardMenuText}>⋯</Text>
                  </TouchableOpacity>

                  <Image
                    source={car.image}
                    style={styles.carImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.carTitle}>{getCarDisplayName(car)}</Text>

                  <View style={styles.carMetaRow}>
                    {!!car.year && <Text style={styles.carMetaText}>{car.year}</Text>}
                    {!!car.year && !!car.licensePlate && (
                      <Text style={styles.carMetaDot}>•</Text>
                    )}
                    {!!car.licensePlate && (
                      <Text style={styles.carMetaText}>{car.licensePlate}</Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          <View style={styles.currentCarNameRow}>
            {carData.map((car, index) => {
              const inputRange = [
                (index - 1) * SNAP_INTERVAL,
                index * SNAP_INTERVAL,
                (index + 1) * SNAP_INTERVAL,
              ];

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              });

              return (
                <Animated.Text
                  key={car.id}
                  style={[styles.currentCarName, { opacity }]}
                >
                  {car.isAddCard ? 'Add a new vehicle' : getCarSubtitle(car)}
                </Animated.Text>
              );
            })}
          </View>

          {carData.length > 1 && (
            <View style={globalStyles.centeredRow}>
              {carData.map((_, index) => {
                const inputRange = [
                  (index - 1) * SNAP_INTERVAL,
                  index * SNAP_INTERVAL,
                  (index + 1) * SNAP_INTERVAL,
                ];

                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.28, 1, 0.28],
                  extrapolate: 'clamp',
                });

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => scrollToCard(index)}
                  >
                    <Animated.View
                      style={[
                        styles.dot,
                        {
                          width: dotWidth,
                          opacity,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={buildRegion(firstMapCoordinate)}
              onMapReady={() => setMapReady(true)}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={locationGranted}
              followsUserLocation={false}
            >
              {selectedCar?.parkedLocation && (
                <Marker
                  key={selectedCar.id}
                  coordinate={selectedCar.parkedLocation}
                  title={getCarDisplayName(selectedCar)}
                  description={selectedCar.licensePlate || 'Saved car location'}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={true}
                >
                  <Image
                    source={selectedCar.image}
                    style={styles.carMarkerImage}
                    resizeMode="contain"
                  />
                </Marker>
              )}
            </MapView>

            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => handleZoom('in')}
              >
                <Text style={styles.zoomText}>＋</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => handleZoom('out')}
              >
                <Text style={styles.zoomText}>－</Text>
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                styles.floatingButtonWrap,
                {
                  bottom: floatingButtonBottom,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.findParkingButton}
                onPress={onFindPress}
                activeOpacity={0.85}
              >
                <Text style={styles.findParkingText}>Find Parking</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.chatSheet,
              {
                height: composerSheetHeight,
                paddingBottom: tabBarHeight + 10,
              },
            ]}
          >
            <View style={styles.chatInputRow}>
              <Animated.View
                style={[
                  styles.chatInputWrap,
                  {
                    minHeight: composerBoxMinHeight,
                  },
                ]}
              >
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ask anything..."
                  placeholderTextColor="#777"
                  value={message}
                  onChangeText={setMessage}
                  onFocus={handleInputFocus}
                  multiline
                />

                <View style={styles.inputFooterRow}>
                  <TouchableOpacity
                    style={styles.footerAction}
                    activeOpacity={0.8}
                    onPress={onChatPress}
                  >
                    <Text style={styles.footerActionText}>＋</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.footerAction}
                    activeOpacity={0.8}
                    onPress={onChatPress}
                  >
                    <Image
                      source={require('../assets/microphone.png')}
                      style={styles.footerIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </View>

      <Modal
        visible={!!menuCar}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuCar(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuCar(null)}>
          <Pressable style={styles.menuSheet} onPress={() => {}}>
            <Text style={styles.menuTitle}>
              {menuCar ? getCarDisplayName(menuCar) : ''}
            </Text>

            <TouchableOpacity
              style={styles.menuAction}
              activeOpacity={0.85}
              onPress={handleEditCar}
            >
              <Text style={styles.menuActionText}>Edit details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuAction, styles.menuActionDanger]}
              activeOpacity={0.85}
              onPress={handleRemoveCar}
            >
              <Text style={styles.menuActionDangerText}>Remove car</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCancel}
              activeOpacity={0.85}
              onPress={() => setMenuCar(null)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  carsSection: {
    marginBottom: spacing.large,
  },

  carsScroll: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen - spacing.cardGap,
  },

  carCard: {
    position: 'relative',
    width: CARD_WIDTH,
    minHeight: height * 0.22,
    borderRadius: radius.large,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    backgroundColor: '#f8f8f8',
    ...shadow.card,
  },

  cardMenuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  cardMenuText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#111',
    fontWeight: '700',
    marginTop: -6,
  },

  carImage: {
    width: '100%',
    height: 95,
    marginBottom: 12,
  },

  carTitle: {
    width: '100%',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
  },

  carMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 18,
  },

  carMetaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  carMetaDot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },

  addCarCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c7c7c7',
    backgroundColor: '#fafafa',
  },

  addCarContent: {
    flex: 1,
    width: '100%',
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addCarPlus: {
    fontSize: 34,
    color: '#222',
    marginBottom: 8,
  },

  addCarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  addCarSubtext: {
    fontSize: 13,
    color: '#666',
  },

  currentCarNameRow: {
    height: 28,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentCarName: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginHorizontal: 4,
    marginTop: 6,
  },

  mapSection: {
    flex: 1,
    position: 'relative',
  },

  mapWrap: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  carMarkerImage: {
    width: 36,
    height: 36,
  },

  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 16,
  },

  zoomButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...shadow.soft,
  },

  zoomText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    lineHeight: 24,
  },

  floatingButtonWrap: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    zIndex: 20,
  },

  findParkingButton: {
    height: 54,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  findParkingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  chatSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 12,
    zIndex: 10,
    ...shadow.card,
  },

  chatInputRow: {
    flexDirection: 'row',
  },

  chatInputWrap: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#fff',
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  chatInput: {
    flex: 1,
    minHeight: 28,
    maxHeight: 110,
    fontSize: 16,
    color: '#111',
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
  },

  inputFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  footerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e9eaee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerActionText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '600',
    lineHeight: 18,
  },

  footerIcon: {
    width: 18,
    height: 18,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },

  menuSheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    ...shadow.card,
  },

  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },

  menuAction: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  menuActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  menuActionDanger: {
    backgroundColor: '#fff1f1',
  },

  menuActionDangerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c62828',
  },

  menuCancel: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  menuCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});