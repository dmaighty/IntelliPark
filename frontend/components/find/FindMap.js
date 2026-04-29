import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { radius, shadow } from '../../styles/global';

export default function FindMap({
  mapRef,
  mapRegion,
  onRegionChangeComplete,
  initialRegion,
  locationGranted,
  carLocation,
  carName,
  searchPin,
  query,
  garages,
  selectedSpotId,
  onSelectGarage,
  onNearMe,
}) {
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={initialRegion}
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

      <TouchableOpacity
        style={styles.nearMeButton}
        onPress={onNearMe}
        activeOpacity={0.85}
      >
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
});