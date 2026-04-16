import React, { useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { globalStyles, spacing } from '../styles/global';
import CarCarousel from '../components/home/CarCarousel';
import MapSection from '../components/home/MapSection';
import ChatSheet from '../components/home/ChatSheet';
import CarMenuModal from '../components/home/CarMenuModal';
import useLocationPermission from '../hooks/useLocationPermission';
import useKeyboardSheet from '../hooks/useKeyboardSheet';
import useHomeCars from '../hooks/useHomeCars';
import useHomeMap from '../hooks/useHomeMap';
import { DEFAULT_COORDS } from '../utils/mapUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + spacing.cardGap;

export default function HomeScreen({
  cars = [],
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
  const [message, setMessage] = useState('');

  const { locationGranted, userLocation } = useLocationPermission();

  const {
    composerBoxMinHeight,
    composerSheetHeight,
    floatingButtonBottom,
    openSheet,
  } = useKeyboardSheet(tabBarHeight);

  const {
    visibleCars,
    carData,
    selectedCar,
    currentCarIndex,
    setCurrentCarIndex,
    menuCar,
    openMenu,
    closeMenu,
    handleEditCar,
    handleRemoveCar,
  } = useHomeCars({
    cars,
    onEditCarPress,
    onRemoveCarPress,
  });

  const firstMapCoordinate = useMemo(
    () => visibleCars[0]?.parkedLocation || DEFAULT_COORDS,
    [visibleCars]
  );

  const {
    mapRef,
    setMapReady,
    setMapRegion,
    focusMapOnCar,
    handleZoom,
    handleFindCar,
    handleFindUser,
  } = useHomeMap({
    firstMapCoordinate,
    selectedCar,
    userLocation,
  });

  const handleInputFocus = () => {
    openSheet();
    onChatPress?.();
  };

  const scrollToCard = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });

    if (index >= 0 && index < visibleCars.length) {
      setCurrentCarIndex(index);
      focusMapOnCar(visibleCars[index], true);
    }
  };

  const handleCardSnap = (snappedIndex) => {
    if (snappedIndex >= 0 && snappedIndex < visibleCars.length) {
      setCurrentCarIndex(snappedIndex);
      focusMapOnCar(visibleCars[snappedIndex], true);
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

        <CarCarousel
          carData={carData}
          scrollX={scrollX}
          scrollViewRef={scrollViewRef}
          onAddCarPress={onAddCarPress}
          onOpenMenu={openMenu}
          onScrollToCard={scrollToCard}
          onCardSnap={handleCardSnap}
        />

        <MapSection
          mapRef={mapRef}
          firstMapCoordinate={firstMapCoordinate}
          locationGranted={locationGranted}
          selectedCar={selectedCar}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={setMapRegion}
          onZoom={handleZoom}
          floatingButtonBottom={floatingButtonBottom}
          onFindPress={onFindPress}
          onFindCarPress={handleFindCar}
          onFindUserPress={handleFindUser}
        />

        <ChatSheet
          composerSheetHeight={composerSheetHeight}
          composerBoxMinHeight={composerBoxMinHeight}
          tabBarHeight={tabBarHeight}
          message={message}
          setMessage={setMessage}
          onInputFocus={handleInputFocus}
          onChatPress={onChatPress}
        />
      </View>

      <CarMenuModal
        visible={!!menuCar}
        menuCar={menuCar}
        onClose={closeMenu}
        onEdit={handleEditCar}
        onRemove={handleRemoveCar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
});