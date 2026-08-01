import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import { loadSavedGarages, removeSavedGarage } from '../utils/savedGarages';

export default function SavedGaragesScreen({ onBack, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [garages, setGarages] = useState([]);

  const loadGarages = async () => {
    setLoading(true);

    try {
      const saved = await loadSavedGarages();
      setGarages(saved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGarages();
  }, []);

  const handleRemove = (garage) => {
    Alert.alert(
      'Remove saved garage',
      `Remove ${garage.name} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = await removeSavedGarage(garage.id);
            setGarages(updated);
            onChanged?.();
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
        <Text style={styles.headerTitle}>Saved Garages</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Garages you favorite on the Find tab appear here.
        </Text>

        {loading ? (
          <ActivityIndicator color="#111" style={styles.loader} />
        ) : garages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="heart-outline" size={28} color="#888" />
            <Text style={styles.emptyTitle}>No saved garages yet</Text>
            <Text style={styles.emptyBody}>
              Open a garage on the Find tab and tap the heart to save it.
            </Text>
          </View>
        ) : (
          garages.map((garage) => (
            <View key={garage.id} style={styles.garageCard}>
              <View style={styles.garageIconWrap}>
                <Ionicons name="business-outline" size={20} color="#111" />
              </View>

              <View style={styles.garageInfo}>
                <Text style={styles.garageName}>{garage.name}</Text>
                {!!garage.address && (
                  <Text style={styles.garageAddress} numberOfLines={2}>
                    {garage.address}
                  </Text>
                )}
                {!!garage.ratePerHour && (
                  <Text style={styles.garageMeta}>{garage.ratePerHour}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(garage)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="heart" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 10,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
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
    lineHeight: 20,
    marginBottom: 16,
  },

  loader: {
    marginTop: 24,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 24,
    alignItems: 'center',
    ...shadow.soft,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginTop: 12,
    marginBottom: 6,
  },

  emptyBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  garageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 14,
    marginBottom: spacing.medium,
    ...shadow.soft,
  },

  garageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eef0f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  garageInfo: {
    flex: 1,
    paddingRight: 8,
  },

  garageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  garageAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },

  garageMeta: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
    marginTop: 4,
  },

  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
