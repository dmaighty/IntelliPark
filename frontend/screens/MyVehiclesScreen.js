import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import { getCarDisplayName, getCarSubtitle } from '../utils/carUtils';
import CarMenuModal from '../components/home/CarMenuModal';

export default function MyVehiclesScreen({
  cars = [],
  onBack,
  onAddCar,
  onEditCar,
  onRemoveCar,
}) {
  const [menuCar, setMenuCar] = useState(null);

  const handleRemove = (car) => {
    Alert.alert(
      'Remove vehicle',
      `Remove ${getCarDisplayName(car)} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onRemoveCar?.(car.id);
            setMenuCar(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
          <Text style={globalStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Manage the vehicles linked to your account.
        </Text>

        {cars.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptyBody}>
              Add a vehicle to track parking and get directions back to it.
            </Text>
          </View>
        ) : (
          cars.map((car) => (
            <View key={car.id} style={styles.carCard}>
              <Image source={car.image} style={styles.carImage} />
              <View style={styles.carInfo}>
                <Text style={styles.carName}>{getCarDisplayName(car)}</Text>
                <Text style={styles.carMeta}>{getCarSubtitle(car)}</Text>
                {!!car.licensePlate && (
                  <Text style={styles.carPlate}>{car.licensePlate}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setMenuCar(car)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.moreButtonText}>•••</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={onAddCar}
        >
          <Text style={styles.addButtonText}>+ Add vehicle</Text>
        </TouchableOpacity>
      </ScrollView>

      <CarMenuModal
        visible={!!menuCar}
        carName={getCarDisplayName(menuCar)}
        onClose={() => setMenuCar(null)}
        onEdit={() => {
          const car = menuCar;
          setMenuCar(null);
          if (car) onEditCar?.(car);
        }}
        onRemove={() => {
          if (menuCar) handleRemove(menuCar);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  headerSpacer: {
    width: 40,
  },

  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
    lineHeight: 20,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 20,
    marginBottom: spacing.medium,
    ...shadow.soft,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  emptyBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  carCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 14,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.soft,
  },

  carImage: {
    width: 72,
    height: 48,
    resizeMode: 'contain',
    marginRight: 12,
  },

  carInfo: {
    flex: 1,
  },

  carName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },

  carMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },

  carPlate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  moreButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },

  addButton: {
    marginTop: 8,
    height: 52,
    borderRadius: radius.medium,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
