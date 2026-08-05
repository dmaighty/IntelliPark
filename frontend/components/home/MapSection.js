import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { spacing, radius, shadow } from '../../styles/global';
import { buildRegion } from '../../utils/mapUtils';
import { getCarDisplayName, getCarStatusLabel } from '../../utils/carUtils';
import useStatusRefreshTick from '../../hooks/useStatusRefreshTick';
import TrackingStatusBanner from './TrackingStatusBanner';

export default function MapSection({
  mapRef,
  firstMapCoordinate,
  locationGranted,
  selectedCar,
  onMapReady,
  onRegionChangeComplete,
  onZoom,
  floatingButtonBottom,
  onFindPress,
  onFindCarPress,
  onFindUserPress,
  onNavigateToCarPress,
  trackingAlert = null,
}) {
  const markerImage =
    selectedCar?.parkedImage || selectedCar?.image || null;

  useStatusRefreshTick(
    selectedCar?.status === 'parked' && Boolean(selectedCar?.parkedAt)
  );

  const canNavigateToCar =
    selectedCar?.status === 'parked' && Boolean(selectedCar?.parkedLocation);

  return (
    <View style={styles.mapSection}>
      <View style={styles.mapWrap}>
        <TrackingStatusBanner alert={trackingAlert} />

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={buildRegion(firstMapCoordinate)}
          onMapReady={onMapReady}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={locationGranted}
          followsUserLocation={false}
        >
          {selectedCar?.parkedLocation && (
            <Marker
              key={selectedCar.id}
              coordinate={selectedCar.parkedLocation}
              title={getCarDisplayName(selectedCar)}
              description={getCarStatusLabel(selectedCar)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              {markerImage ? (
                <Image
                  source={markerImage}
                  style={styles.carMarkerImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.carMarkerFallback}>
                  <Ionicons
                    name="car-sport"
                    size={20}
                    color="#111"
                  />
                </View>
              )}
            </Marker>
          )}
        </MapView>

        <View style={styles.leftControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onFindCarPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name="car-sport-outline"
              size={20}
              color="#111"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={onFindUserPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name="navigate"
              size={18}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => onZoom?.('in')}
            activeOpacity={0.85}
          >
            <Text style={styles.zoomText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => onZoom?.('out')}
            activeOpacity={0.85}
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
          <View style={styles.actionBar}>
            {canNavigateToCar ? (
              <>
                <TouchableOpacity
                  style={styles.actionBarButton}
                  onPress={onNavigateToCarPress}
                  activeOpacity={0.85}
                >
                  <Ionicons name="walk-outline" size={17} color="#fff" />
                  <Text style={styles.actionBarText} numberOfLines={1}>
                    To car
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionBarDivider} />
              </>
            ) : null}

            <TouchableOpacity
              style={styles.actionBarButton}
              onPress={onFindPress}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={17} color="#fff" />
              <Text style={styles.actionBarText} numberOfLines={1}>
                Find Parking
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  carMarkerFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  leftControls: {
    position: 'absolute',
    left: 16,
    top: 16,
  },

  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 16,
  },

  controlButton: {
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

  actionBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 54,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    overflow: 'hidden',
    ...shadow.card,
  },

  actionBarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },

  actionBarDivider: {
    width: 1,
    backgroundColor: '#333',
    marginVertical: 14,
  },

  actionBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});