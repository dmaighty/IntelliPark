import React, { useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
} from 'react-native';

import { globalStyles, spacing } from '../styles/global';
import { getProfileImageSource } from '../utils/profileImage';
import { pickChatImage } from '../utils/chatAttachments';

import CarCarousel from '../components/home/CarCarousel';
import MapSection from '../components/home/MapSection';
import ChatSheet from '../components/home/ChatSheet';
import CarMenuModal from '../components/home/CarMenuModal';

import useLocationPermission from '../hooks/useLocationPermission';
import useKeyboardSheet from '../hooks/useKeyboardSheet';
import useHomeCars from '../hooks/useHomeCars';
import useHomeMap from '../hooks/useHomeMap';

import { DEFAULT_COORDS } from '../utils/mapUtils';
import { getCarDisplayName } from '../utils/carUtils';
import { openWalkingDirections } from '../utils/navigationUtils';
import { pickParkedSpotPhoto } from '../utils/parkedSpotPhoto';

import ParkedPhotoPrompt from '../components/home/ParkedPhotoPrompt';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + spacing.cardGap;

export default function HomeScreen({
  cars = [],
  trackedCarId = null,
  onTrackCar,
  trackingAlert = null,
  pendingParkPhotoCarId = null,
  onSaveParkedSpotPhoto,
  onDismissParkPhotoPrompt,
  onMarkParkedManually,
  profileImageUrl = null,
  onProfilePress,
  onFindPress,
  onChatPress,
  chatDraft = { message: '', images: [] },
  setChatDraft,
  onAddCarPress,
  onEditCarPress,
  onRemoveCarPress,
  tabBarHeight = 100,
}) {
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef(null);

  const message = chatDraft.message || '';
  const images = chatDraft.images || [];

  const setMessage = useCallback(
    (nextMessage) => {
      setChatDraft?.((prev) => ({
        ...prev,
        message: typeof nextMessage === 'function'
          ? nextMessage(prev.message || '')
          : nextMessage,
      }));
    },
    [setChatDraft]
  );

  const setImages = useCallback(
    (updater) => {
      setChatDraft?.((prev) => ({
        ...prev,
        images: typeof updater === 'function'
          ? updater(prev.images || [])
          : updater,
      }));
    },
    [setChatDraft]
  );

  const {
    locationGranted,
    userLocation,
  } = useLocationPermission();

  const {
    composerBoxMinHeight,
    composerSheetHeight,
    floatingButtonBottom,
  } = useKeyboardSheet(tabBarHeight);

  const {
    visibleCars,
    carData,
    selectedCar,
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

  const firstMapCoordinate = React.useMemo(() => {
    return (
      visibleCars[0]?.parkedLocation ||
      DEFAULT_COORDS
    );
  }, [visibleCars]);

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

  const handleOpenChat = useCallback(
    (options = {}) => {
      onChatPress?.(options);
    },
    [onChatPress]
  );

  const handleAddImage = useCallback(async () => {
    const picked = await pickChatImage();

    if (picked) {
      setImages((prev) => [...prev, picked]);
    }
  }, [setImages]);

  const handleRemoveImage = useCallback(
    (imageId) => {
      setImages((prev) => prev.filter((image) => image.id !== imageId));
    },
    [setImages]
  );

  const handleSendFromHome = useCallback(() => {
    const trimmed = message.trim();

    if (!trimmed && images.length === 0) {
      handleOpenChat();
      return;
    }

    onChatPress?.({ send: true });
  }, [message, images.length, handleOpenChat, onChatPress]);

  const handleCarCardPress = (car) => {
    if (!car || car.isAddCard) {
      return;
    }

    onEditCarPress?.(car);
  };

  const scrollToCard = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });

    if (
      index >= 0 &&
      index < visibleCars.length
    ) {
      setCurrentCarIndex(index);
      focusMapOnCar(visibleCars[index], true);
    }
  };

  const handleCardSnap = (snappedIndex) => {
    if (
      snappedIndex >= 0 &&
      snappedIndex < visibleCars.length
    ) {
      setCurrentCarIndex(snappedIndex);

      focusMapOnCar(
        visibleCars[snappedIndex],
        true
      );
    }
  };

  const handleNavigateToCar = useCallback(async () => {
    if (!selectedCar?.parkedLocation) {
      return;
    }

    await openWalkingDirections(selectedCar.parkedLocation);
  }, [selectedCar]);

  const pendingPhotoCar = visibleCars.find(
    (car) => String(car.id) === String(pendingParkPhotoCarId)
  );

  const handleTakeParkedPhoto = useCallback(async () => {
    if (!pendingPhotoCar) {
      return;
    }

    const photoUri = await pickParkedSpotPhoto();

    if (photoUri) {
      onSaveParkedSpotPhoto?.(pendingPhotoCar.id, photoUri);
      return;
    }

    onDismissParkPhotoPrompt?.(pendingPhotoCar.id);
  }, [
    onDismissParkPhotoPrompt,
    onSaveParkedSpotPhoto,
    pendingPhotoCar,
  ]);

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.screenContent}>
        <View style={globalStyles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={globalStyles.profileCircle}
              onPress={onProfilePress}
              activeOpacity={0.85}
            >
              <Image
                source={getProfileImageSource(profileImageUrl)}
                style={globalStyles.profileImage}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Intellipark</Text>
          </View>
        </View>

        <CarCarousel
          carData={carData}
          scrollX={scrollX}
          scrollViewRef={scrollViewRef}
          onAddCarPress={onAddCarPress}
          onOpenMenu={openMenu}
          onCarPress={handleCarCardPress}
          onScrollToCard={scrollToCard}
          onCardSnap={handleCardSnap}
        />

        <MapSection
          mapRef={mapRef}
          firstMapCoordinate={firstMapCoordinate}
          locationGranted={locationGranted}
          selectedCar={selectedCar}
          trackingAlert={trackingAlert}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={setMapRegion}
          onZoom={handleZoom}
          floatingButtonBottom={floatingButtonBottom}
          onFindPress={onFindPress}
          onFindCarPress={handleFindCar}
          onFindUserPress={handleFindUser}
          onNavigateToCarPress={handleNavigateToCar}
        />

        <ChatSheet
          composerSheetHeight={composerSheetHeight}
          composerBoxMinHeight={composerBoxMinHeight}
          tabBarHeight={tabBarHeight}
          message={message}
          setMessage={setMessage}
          images={images}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
          onSend={handleSendFromHome}
          onOpenChat={handleOpenChat}
        />
      </View>

      <CarMenuModal
        visible={Boolean(menuCar)}
        menuCar={menuCar}
        carName={menuCar ? getCarDisplayName(menuCar) : ''}
        isTracked={
          menuCar &&
          trackedCarId != null &&
          String(menuCar.id) === String(trackedCarId)
        }
        canNavigateToCar={
          Boolean(
            menuCar?.status === 'parked' && menuCar?.parkedLocation
          )
        }
        onClose={closeMenu}
        onTrack={() => {
          if (menuCar) {
            onTrackCar?.(menuCar.id);
          }
          closeMenu();
        }}
        onMarkParked={() => {
          if (menuCar) {
            onMarkParkedManually?.(menuCar.id);
          }
          closeMenu();
        }}
        onNavigateToCar={async () => {
          if (menuCar?.parkedLocation) {
            await openWalkingDirections(menuCar.parkedLocation);
          }
          closeMenu();
        }}
        onEdit={handleEditCar}
        onRemove={handleRemoveCar}
      />

      <ParkedPhotoPrompt
        visible={Boolean(pendingPhotoCar)}
        carName={
          pendingPhotoCar ? getCarDisplayName(pendingPhotoCar) : 'your car'
        }
        onTakePhoto={handleTakeParkedPhoto}
        onSkip={() => onDismissParkPhotoPrompt?.(pendingPhotoCar?.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
