import React, { useEffect, useRef, useState } from 'react';
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

const cars = [
  {
    id: 1,
    year: '2024',
    title: 'Toyota Camry',
    image: require('../assets/car.png'),
  },
  {
    id: 2,
    year: '2023',
    title: 'Honda Civic',
    image: require('../assets/car.png'),
  },
  {
    id: 3,
    year: '2022',
    title: 'Tesla Model 3',
    image: require('../assets/car.png'),
  },
];

export default function HomeScreen({
  onProfilePress,
  onFindPress,
  onChatPress,
  tabBarHeight = 100,
}) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const mapRef = useRef(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const [userLocation, setUserLocation] = useState(DEFAULT_COORDS);
  const [carLocation, setCarLocation] = useState({
    latitude: DEFAULT_COORDS.latitude + 0.0007,
    longitude: DEFAULT_COORDS.longitude - 0.0005,
  });

  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [message, setMessage] = useState('');

  const carData = [...cars.slice(0, 7), { id: 'add', isAddCard: true }];

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!mounted) return;
        setUserLocation(DEFAULT_COORDS);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      if (!mounted) return;

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const nextCarLocation = {
        latitude: coords.latitude + 0.0007,
        longitude: coords.longitude - 0.0005,
      };

      setUserLocation(coords);
      setCarLocation(nextCarLocation);

      const nextRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMapRegion(nextRegion);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates([coords, nextCarLocation], {
          edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
          animated: true,
        });
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

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
  };

  const handleZoom = (direction) => {
    const factor = direction === 'in' ? 0.7 : 1.4;

    const nextRegion = {
      ...mapRegion,
      latitudeDelta: Math.max(0.002, Math.min(1, mapRegion.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.002, Math.min(1, mapRegion.longitudeDelta * factor)),
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

    if (typeof onChatPress === 'function') {
      onChatPress();
    }
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
                    <TouchableOpacity style={styles.addCarContent} activeOpacity={0.9}>
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
                  <Image
                    source={car.image}
                    style={styles.carImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.carYear}>{car.year}</Text>
                  <Text style={styles.carTitle}>{car.title}</Text>
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
                  {car.isAddCard ? 'Add a new vehicle' : `${car.year} ${car.title}`}
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
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={true}
              initialRegion={{
                latitude: DEFAULT_COORDS.latitude,
                longitude: DEFAULT_COORDS.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={carLocation}
                title="Your Car"
                description="Current parked car location"
                tracksViewChanges={false}
              >
                <Image
                  source={require('../assets/car.png')}
                  style={styles.carMarkerImage}
                  resizeMode="contain"
                />
              </Marker>
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
    width: CARD_WIDTH,
    minHeight: height * 0.2,
    borderRadius: radius.large,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    backgroundColor: '#f8f8f8',
    ...shadow.card,
  },

  carImage: {
    width: '100%',
    height: 95,
    marginBottom: 10,
  },

  carYear: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },

  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
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
    height: 24,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentCarName: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
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
    width: 34,
    height: 34,
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
    color: '#fff',
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
});