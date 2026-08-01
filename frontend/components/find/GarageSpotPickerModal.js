import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { getLiveFramePredictions } from '../../api/prediction';
import GarageSpotMap from './GarageSpotMap';
import { spacing, shadow, colors } from '../../styles/global';
import {
  mapLivePredictionSpots,
  mapStaticLevelLayout,
} from '../../utils/garageSpotMap';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function GarageSpotPickerModal({
  visible,
  garage,
  onClose,
  onAvailabilityChange,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [livePayload, setLivePayload] = useState(null);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    setSelectedLevelId(garage?.levels?.[0]?.id || null);
    setSelectedSpotId(null);
  }, [garage]);

  const selectedLevel = useMemo(() => {
    if (!garage?.levels?.length) {
      return null;
    }

    return (
      garage.levels.find((level) => level.id === selectedLevelId) ||
      garage.levels[0]
    );
  }, [garage, selectedLevelId]);

  const loadLiveSpots = useCallback(async () => {
    if (!garage?.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getLiveFramePredictions({
        lotId: garage.id,
        conf: 0.1,
        imgsz: 960,
      });

      setLivePayload(data);

      if (Array.isArray(data?.spots) && data.spots.length > 0) {
        setUsingLiveData(true);

        if (
          typeof data.empty === 'number' &&
          typeof data.total_spots === 'number' &&
          data.total_spots > 0
        ) {
          onAvailabilityChange?.(garage.id, data.empty);
        }
        return;
      }

      setUsingLiveData(false);
      setError(
        'Live camera spots are not configured yet. Showing the garage layout instead.'
      );
    } catch (loadError) {
      setLivePayload(null);
      setUsingLiveData(false);
      setError(
        loadError?.message ||
          'Could not load live camera data. Showing the garage layout instead.'
      );
    } finally {
      setLoading(false);
    }
  }, [garage?.id, onAvailabilityChange]);

  useEffect(() => {
    if (!visible || !garage?.id) {
      setLivePayload(null);
      setError('');
      setSelectedSpotId(null);
      return;
    }

    loadLiveSpots();
  }, [visible, garage?.id, loadLiveSpots]);

  const spots = useMemo(() => {
    const liveSpots = mapLivePredictionSpots(livePayload);

    if (liveSpots.length > 0) {
      return liveSpots;
    }

    return mapStaticLevelLayout(selectedLevel?.layout || []);
  }, [livePayload, selectedLevel]);

  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) || null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {garage?.name || 'Garage spots'}
            </Text>
            <Text style={styles.subtitle}>Live spot map</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!garage?.levels?.length && !usingLiveData && (
            <View style={styles.levelTabs}>
              {garage.levels.map((level) => {
                const isSelected = level.id === selectedLevel?.id;

                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.levelTab,
                      isSelected && styles.levelTabSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedLevelId(level.id)}
                  >
                    <Text
                      style={[
                        styles.levelTabText,
                        isSelected && styles.levelTabTextSelected,
                      ]}
                    >
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <GarageSpotMap
            spots={spots}
            loading={loading}
            error={error}
            liveSource={usingLiveData}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            onRefresh={loadLiveSpots}
          />

          {selectedSpot ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>
                {selectedSpot.seatLabel || selectedSpot.label}
              </Text>
              <Text style={styles.selectedBody}>
                This spot is open and ready to park.
              </Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              Tap an open spot to select it. Occupied spots are based on the
              garage camera feed.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 28,
    color: '#111',
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 42,
    alignItems: 'center',
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 32,
    minHeight: WINDOW_HEIGHT * 0.55,
  },

  levelTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 12,
  },

  levelTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },

  levelTabSelected: {
    backgroundColor: '#111',
  },

  levelTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },

  levelTabTextSelected: {
    color: '#fff',
  },

  selectedCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    ...shadow.soft,
  },

  selectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  selectedBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },

  hintText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
    textAlign: 'center',
  },
});
