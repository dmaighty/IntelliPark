import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import {
  loadSavedPlaces,
  saveSavedPlaces,
  SAVED_PLACE_IDS,
  isPlaceConfigured,
} from '../utils/savedPlaces';

const PLACE_ICONS = {
  home: 'home-outline',
  work: 'briefcase-outline',
  school: 'school-outline',
};

const emptyDrafts = () =>
  SAVED_PLACE_IDS.reduce((accumulator, id) => {
    accumulator[id] = '';
    return accumulator;
  }, {});

async function geocodeAddress(address) {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  const results = await Location.geocodeAsync(trimmed);

  if (!results?.length) {
    return null;
  }

  const first = results[0];
  const formattedAddress = [
    first.name,
    first.street,
    first.city,
    first.region,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    address: formattedAddress || trimmed,
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

export default function SavedPlacesScreen({ onBack, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState(emptyDrafts());
  const [configured, setConfigured] = useState(emptyDrafts());

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const places = await loadSavedPlaces();
        const nextDrafts = emptyDrafts();
        const nextConfigured = emptyDrafts();

        places.forEach((place) => {
          nextDrafts[place.id] = place.address || '';
          nextConfigured[place.id] = isPlaceConfigured(place);
        });

        setDrafts(nextDrafts);
        setConfigured(nextConfigured);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateDraft = (id, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existing = await loadSavedPlaces();
      const nextPlaces = [];

      for (const place of existing) {
        const trimmed = drafts[place.id]?.trim() || '';

        if (!trimmed) {
          nextPlaces.push({
            ...place,
            address: '',
            latitude: null,
            longitude: null,
            configured: false,
          });
          continue;
        }

        const geocoded = await geocodeAddress(trimmed);

        if (!geocoded) {
          Alert.alert(
            'Address not found',
            `Could not find a location for ${place.label}. Try a more specific address.`
          );
          setSaving(false);
          return;
        }

        nextPlaces.push({
          ...place,
          address: geocoded.address,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          configured: true,
        });
      }

      await saveSavedPlaces(nextPlaces);
      onSaved?.(nextPlaces);
    } catch (error) {
      Alert.alert(
        'Could not save places',
        error?.message || 'Something went wrong while saving your places.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topSection}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
              <Text style={globalStyles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Pinned Locations</Text>
            <View style={styles.topBarSpacer} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#111" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.introText}>
              Pin the places you go most often. They will show up on the Find
              tab for quick navigation.
            </Text>

            {SAVED_PLACE_IDS.map((id) => (
              <View key={id} style={styles.placeCard}>
                <View style={styles.placeHeader}>
                  <View style={styles.placeIconWrap}>
                    <Ionicons
                      name={PLACE_ICONS[id] || 'location-outline'}
                      size={20}
                      color="#111"
                    />
                  </View>
                  <View style={styles.placeHeaderText}>
                    <Text style={styles.placeLabel}>
                      {id === 'home'
                        ? 'Home'
                        : id === 'work'
                          ? 'Work'
                          : 'School'}
                    </Text>
                    <Text style={styles.placeStatus}>
                      {configured[id] ? 'Saved' : 'Not set yet'}
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  value={drafts[id]}
                  onChangeText={(value) => updateDraft(id, value)}
                  placeholder={
                    id === 'home'
                      ? '123 Main St, San Jose, CA'
                      : id === 'work'
                        ? 'Office address'
                        : 'Campus or school address'
                  }
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving…' : 'Save Places'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  topSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.screen,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  topBarSpacer: {
    width: 42,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  introText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 18,
  },

  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
    marginBottom: 14,
    ...shadow.soft,
  },

  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  placeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  placeHeaderText: {
    flex: 1,
  },

  placeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  placeStatus: {
    marginTop: 2,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111',
  },

  saveButton: {
    height: 54,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...shadow.card,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
