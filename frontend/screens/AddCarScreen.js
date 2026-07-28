import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from 'react-native';

import {
  globalStyles,
  spacing,
  radius,
  shadow,
} from '../styles/global';

const carColors = [
  {
    id: 'black',
    label: 'Black',
    swatch: '#111111',

    // Carousel and edit screen
    image: require('../assets/car-black.png'),

    // Map marker
    parkedImage: require('../assets/parked-black-car.png'),
  },
  {
    id: 'white',
    label: 'White',
    swatch: '#F5F5F5',

    image: require('../assets/car-white.png'),
    parkedImage: require('../assets/parked-white-car.png'),
  },
  {
    id: 'red',
    label: 'Red',
    swatch: '#D92D20',

    image: require('../assets/car-red.png'),
    parkedImage: require('../assets/parked-red-car.png'),
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#369FD9',

    image: require('../assets/car-blue.png'),
    parkedImage: require('../assets/parked-blue-car.png'),
  },
  {
    id: 'silver',
    label: 'Silver',
    swatch: '#A1A1A1',

    image: require('../assets/car-silver.png'),
    parkedImage: require('../assets/parked-silver-car.png'),
  },
  {
    id: 'yellow',
    label: 'Yellow',
    swatch: '#F8BF01',

    image: require('../assets/car-yellow.png'),
    parkedImage: require('../assets/parked-yellow-car.png'),
  },
];

const getMatchingColor = (car) => {
  if (!car) {
    return carColors[0];
  }

  const normalizedColorId = String(car.colorId || '')
    .trim()
    .toLowerCase();

  const normalizedColorLabel = String(car.color || '')
    .trim()
    .toLowerCase();

  return (
    carColors.find((color) => color.id === normalizedColorId) ||
    carColors.find(
      (color) => color.label.toLowerCase() === normalizedColorLabel
    ) ||
    carColors[0]
  );
};

export default function AddCarScreen({
  route,
  navigation,

  // These props allow the screen to work without React Navigation too.
  initialCar: initialCarProp = null,
  onBack,
  onSave,
}) {
  /*
   * When opened by pressing a carousel card, the car can be supplied through:
   *
   * navigation.navigate('AddCar', { initialCar: car })
   *
   * The initialCar prop remains supported for your existing setup.
   */
  const initialCar =
    route?.params?.initialCar ||
    route?.params?.car ||
    initialCarProp ||
    null;

  const [carName, setCarName] = useState('');
  const [make, setMake] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedColor, setSelectedColor] = useState(carColors[0]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(initialCar);

  useEffect(() => {
    if (initialCar) {
      setCarName(
        initialCar.title ||
          initialCar.name ||
          initialCar.make ||
          ''
      );

      setMake(
        initialCar.make ||
          initialCar.model ||
          initialCar.title ||
          ''
      );

      setYear(String(initialCar.year || ''));

      setLicensePlate(
        String(initialCar.licensePlate || '').toUpperCase()
      );

      setSelectedColor(getMatchingColor(initialCar));
      return;
    }

    setCarName('');
    setMake('');
    setYear('');
    setLicensePlate('');
    setSelectedColor(carColors[0]);
  }, [initialCar]);

  const isValid = useMemo(() => {
    return (
      carName.trim().length > 0 &&
      make.trim().length > 0 &&
      /^\d{4}$/.test(year.trim()) &&
      licensePlate.trim().length > 0 &&
      Boolean(selectedColor)
    );
  }, [
    carName,
    make,
    year,
    licensePlate,
    selectedColor,
  ]);

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }

    navigation?.goBack();
  };

  const handleSave = async () => {
    const trimmedCarName = carName.trim();
    const trimmedMake = make.trim();
    const trimmedYear = year.trim();
    const trimmedPlate = licensePlate
      .trim()
      .toUpperCase();

    if (!trimmedCarName) {
      Alert.alert(
        'Missing car name',
        'Please enter a name for this car.'
      );
      return;
    }

    if (!trimmedMake) {
      Alert.alert(
        'Missing make and model',
        'Please enter the car make and model.'
      );
      return;
    }

    if (!/^\d{4}$/.test(trimmedYear)) {
      Alert.alert(
        'Invalid year',
        'Please enter a valid 4-digit year.'
      );
      return;
    }

    if (!trimmedPlate) {
      Alert.alert(
        'Missing license plate',
        'Please enter the license plate.'
      );
      return;
    }

    const savedCar = {
      /*
       * Preserve tracking, Bluetooth, parking location,
       * trip distance, and other existing properties.
       */
      ...(initialCar || {}),

      id: initialCar?.id ?? Date.now(),

      // User-editable display name
      title: trimmedCarName,

      // Actual vehicle make/model
      make: trimmedMake,

      year: trimmedYear,
      licensePlate: trimmedPlate,

      color: selectedColor.label,
      colorId: selectedColor.id,

      // Carousel and details screen image
      image: selectedColor.image,

      // Map marker image
      parkedImage: selectedColor.parkedImage,

      // Defaults only apply to newly added cars
      status: initialCar?.status || 'parked',

      bluetoothDeviceId:
        initialCar?.bluetoothDeviceId || null,

      bluetoothDeviceName:
        initialCar?.bluetoothDeviceName || null,

      tripStartedAt:
        initialCar?.tripStartedAt || null,

      tripDistanceMeters:
        initialCar?.tripDistanceMeters || 0,

      parkedAt:
        initialCar?.parkedAt || null,

      parkedLocation:
        initialCar?.parkedLocation || null,
    };

    try {
      setIsSaving(true);

      if (typeof onSave === 'function') {
        await onSave(savedCar);
        handleBack();
        return;
      }

      Alert.alert(
        isEditing ? 'Car updated' : 'Car added',
        `${trimmedCarName} was successfully ${
          isEditing ? 'updated' : 'added'
        }.`,
        [
          {
            text: 'OK',
            onPress: handleBack,
          },
        ]
      );
    } catch (error) {
      console.error('Unable to save car:', error);

      Alert.alert(
        'Unable to save car',
        error?.message ||
          'Something went wrong while saving the car.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Car' : 'Add New Car'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Image
              source={selectedColor.image}
              style={styles.heroImage}
              resizeMode="contain"
            />

            <Text
              style={styles.heroTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {carName.trim() || 'Your Car'}
            </Text>

            <Text style={styles.heroSubtitle}>
              {year || 'YYYY'}{' '}
              {make.trim() || 'Make and model'}
            </Text>

            <Text style={styles.heroSubtitle}>
              {selectedColor.label} •{' '}
              {licensePlate.trim()
                ? licensePlate.trim().toUpperCase()
                : 'LICENSE PLATE'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Car Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Sarah's Camry"
              placeholderTextColor="#888"
              value={carName}
              onChangeText={setCarName}
              autoCapitalize="words"
              maxLength={40}
              returnKeyType="next"
            />

            <Text style={styles.helperText}>
              This is the name displayed on the carousel.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Make and Model</Text>

            <TextInput
              style={styles.input}
              placeholder="Toyota Camry"
              placeholderTextColor="#888"
              value={make}
              onChangeText={setMake}
              autoCapitalize="words"
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Year</Text>

            <TextInput
              style={styles.input}
              placeholder="2024"
              placeholderTextColor="#888"
              value={year}
              onChangeText={(text) => {
                const numbersOnly = text.replace(
                  /[^0-9]/g,
                  ''
                );

                setYear(numbersOnly.slice(0, 4));
              }}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>License Plate</Text>

            <TextInput
              style={styles.input}
              placeholder="8ABC123"
              placeholderTextColor="#888"
              value={licensePlate}
              onChangeText={(text) => {
                const cleanedPlate = text
                  .replace(/[^a-zA-Z0-9 -]/g, '')
                  .toUpperCase();

                setLicensePlate(cleanedPlate);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Pick Car Color</Text>

            <View style={styles.colorGrid}>
              {carColors.map((colorOption) => {
                const selected =
                  selectedColor?.id === colorOption.id;

                return (
                  <TouchableOpacity
                    key={colorOption.id}
                    style={[
                      styles.colorCard,
                      selected &&
                        styles.colorCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedColor(colorOption);
                    }}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor:
                            colorOption.swatch,
                        },
                        (colorOption.id === 'white' ||
                          colorOption.id === 'silver') &&
                          styles.lightSwatch,
                      ]}
                    />

                    <Text
                      style={[
                        styles.colorLabel,
                        selected &&
                          styles.colorLabelSelected,
                      ]}
                    >
                      {colorOption.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isValid || isSaving) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!isValid || isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Save Car'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 28,
    color: '#111',
    lineHeight: 28,
    marginTop: -2,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  headerSpacer: {
    width: 42,
  },

  content: {
    paddingBottom: 24,
  },

  heroCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.large,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    ...shadow.card,
  },

  heroImage: {
    width: '100%',
    height: 120,
    marginBottom: 12,
  },

  heroTitle: {
    width: '100%',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111',
  },

  helperText: {
    marginTop: 6,
    paddingHorizontal: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#777',
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  colorCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.soft,
  },

  colorCardSelected: {
    borderColor: '#000',
    backgroundColor: '#efefef',
  },

  colorSwatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 10,
  },

  lightSwatch: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },

  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },

  colorLabelSelected: {
    color: '#000',
  },

  footer: {
    paddingTop: 8,
    paddingBottom: 18,
  },

  saveButton: {
    height: 56,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});