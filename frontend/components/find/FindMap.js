import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow } from '../../styles/global';
import {
  getCarDisplayName,
  getCarStatusLabel,
} from '../../utils/carUtils';
import useStatusRefreshTick from '../../hooks/useStatusRefreshTick';

export default function FindMap({
  mapRef,
  initialRegion,
  onRegionChangeComplete,
  onMapReady,
  locationGranted,
  recentlyParkedCar,
  selectedCarId,
  searchPlaces = [],
  selectedPlaceId,
  garages,
  selectedSpotId,
  onSelectGarage,
  onSelectCar,
  onSelectSearchPlace,
  onNearMe,
}) {
  useStatusRefreshTick(
    recentlyParkedCar?.status === 'parked' &&
      Boolean(recentlyParkedCar?.parkedAt)
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={onMapReady}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
      >
        {recentlyParkedCar?.parkedLocation ? (
          <Marker
            key={recentlyParkedCar.id}
            coordinate={recentlyParkedCar.parkedLocation}
            title={getCarDisplayName(recentlyParkedCar)}
            description={getCarStatusLabel(recentlyParkedCar)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => onSelectCar?.(recentlyParkedCar)}
            zIndex={selectedCarId === recentlyParkedCar.id ? 2 : 1}
          >
            {recentlyParkedCar.parkedImage || recentlyParkedCar.image ? (
              <View
                style={[
                  styles.carMarkerWrap,
                  selectedCarId === recentlyParkedCar.id &&
                    styles.carMarkerWrapSelected,
                ]}
              >
                <Image
                  source={
                    recentlyParkedCar.parkedImage || recentlyParkedCar.image
                  }
                  style={styles.carMarkerImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View
                style={[
                  styles.carMarkerFallback,
                  selectedCarId === recentlyParkedCar.id &&
                    styles.carMarkerWrapSelected,
                ]}
              >
                <Ionicons name="car-sport" size={20} color="#111" />
              </View>
            )}
          </Marker>
        ) : null}

        {searchPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            description={place.category}
            pinColor={selectedPlaceId === place.id ? 'red' : '#007aff'}
            onPress={() => onSelectSearchPlace?.(place)}
          />
        ))}

        {garages.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.name}
            description={spot.address}
            pinColor={selectedSpotId === spot.id ? 'green' : undefined}
            onPress={() => onSelectGarage(spot)}
          />
        ))}
      </MapView>

      {recentlyParkedCar ? (
        <TouchableOpacity
          style={styles.carControlButton}
          onPress={() => onSelectCar?.(recentlyParkedCar)}
          activeOpacity={0.85}
        >
          {recentlyParkedCar.parkedImage || recentlyParkedCar.image ? (
            <Image
              source={
                recentlyParkedCar.parkedImage || recentlyParkedCar.image
              }
              style={styles.carControlImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="car-sport-outline" size={20} color="#111" />
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.nearMeButton}
        onPress={onNearMe}
        activeOpacity={0.85}
      >
        <Ionicons name="navigate" size={18} color="#111" />
        <Text style={styles.nearMeText}>Find Me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  carMarkerWrap: {
    padding: 2,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...shadow.soft,
  },

  carMarkerWrapSelected: {
    borderWidth: 2,
    borderColor: '#111',
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

  carControlButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  carControlImage: {
    width: 28,
    height: 28,
  },

  nearMeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadow.soft,
  },

  nearMeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
});
