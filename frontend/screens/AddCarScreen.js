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
import { globalStyles, spacing, radius, shadow } from '../styles/global';

const carColors = [
  {
    id: 'black',
    label: 'Black',
    swatch: '#111111',
    image: require('../assets/parked-black-car.png'),
  },
  {
    id: 'white',
    label: 'White',
    swatch: '#F5F5F5',
    image: require('../assets/parked-white-car.png'),
  },
  {
    id: 'red',
    label: 'Red',
    swatch: '#D92D20',
    image: require('../assets/parked-red-car.png'),
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#369FD9',
    image: require('../assets/parked-blue-car.png'),
  },
  {
    id: 'silver',
    label: 'Silver',
    swatch: '#A1A1A1',
    image: require('../assets/parked-silver-car.png'),
  },
  {
    id: 'yellow',
    label: 'Yellow',
    swatch: '#F8BF01',
    image: require('../assets/parked-yellow-car.png'),
  },
];

export default function AddCarScreen({
  initialCar = null,
  onBack,
  onSave,
}) {
  const [make, setMake] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedColor, setSelectedColor] = useState(carColors[0]);

  useEffect(() => {
    if (initialCar) {
      setMake(initialCar.make || initialCar.title || '');
      setYear(initialCar.year || '');
      setLicensePlate(initialCar.licensePlate || '');

      const matchedColor =
        carColors.find((color) => color.id === initialCar.colorId) ||
        carColors.find((color) => color.label === initialCar.color) ||
        carColors[0];

      setSelectedColor(matchedColor);
    } else {
      setMake('');
      setYear('');
      setLicensePlate('');
      setSelectedColor(carColors[0]);
    }
  }, [initialCar]);

  const isValid = useMemo(() => {
    return (
      make.trim().length > 0 &&
      year.trim().length === 4 &&
      licensePlate.trim().length > 0 &&
      !!selectedColor
    );
  }, [make, year, licensePlate, selectedColor]);

  const handleSave = async () => {
    const trimmedMake = make.trim();
    const trimmedYear = year.trim();
    const trimmedPlate = licensePlate.trim().toUpperCase();

    if (!trimmedMake) {
      Alert.alert('Missing make', 'Please enter the car make.');
      return;
    }

    if (!/^\d{4}$/.test(trimmedYear)) {
      Alert.alert('Invalid year', 'Please enter a valid 4-digit year.');
      return;
    }

    if (!trimmedPlate) {
      Alert.alert('Missing license plate', 'Please enter the license plate.');
      return;
    }

    const savedCar = {
      ...(initialCar || {}),
      make: trimmedMake,
      title: trimmedMake,
      year: trimmedYear,
      licensePlate: trimmedPlate,
      color: selectedColor.label,
      colorId: selectedColor.id,
      image: selectedColor.image,
    };

    if (typeof onSave === 'function') {
      await onSave(savedCar);
      return;
    }

    Alert.alert(
      'Saved',
      `${trimmedYear} ${trimmedMake} ${initialCar ? 'updated' : 'added'}.`
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {initialCar ? 'Edit Car' : 'Add New Car'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Image
              source={selectedColor.image}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>
              {year || 'YYYY'} {make || 'Your Car'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {selectedColor.label} •{' '}
              {licensePlate ? licensePlate.toUpperCase() : 'LICENSE PLATE'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              placeholder="Toyota"
              placeholderTextColor="#888"
              value={make}
              onChangeText={setMake}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="2024"
              placeholderTextColor="#888"
              value={year}
              onChangeText={(text) =>
                setYear(text.replace(/[^0-9]/g, '').slice(0, 4))
              }
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
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Pick Car Color</Text>

            <View style={styles.colorGrid}>
              {carColors.map((colorOption) => {
                const selected = selectedColor?.id === colorOption.id;

                return (
                  <TouchableOpacity
                    key={colorOption.id}
                    style={[
                      styles.colorCard,
                      selected && styles.colorCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedColor(colorOption)}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: colorOption.swatch },
                        (colorOption.id === 'white' ||
                          colorOption.id === 'silver') &&
                          styles.lightSwatch,
                      ]}
                    />
                    <Text
                      style={[
                        styles.colorLabel,
                        selected && styles.colorLabelSelected,
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
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {initialCar ? 'Save Changes' : 'Save Car'}
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
    fontSize: 20,
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
    opacity: 0.55,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});