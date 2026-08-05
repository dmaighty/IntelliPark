import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, colors } from '../../styles/global';
import { getDistanceMiles, enrichGarageWithDefaults } from '../../utils/findUtils';
import {
  formatDriveEta,
  formatUpdatedAgo,
} from '../../utils/garagePredictionUtils';
import { getLiveFramePredictions } from '../../api/prediction';
import GarageSpotPickerModal from './GarageSpotPickerModal';

const { height } = Dimensions.get('window');

export default function GarageInfoModal({
  visible,
  garage,
  userLocation,
  isSaved = false,
  onClose,
  onDirections,
  onGarageLotPage,
  onAvailabilityChange,
  onToggleFavorite,
}) {
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [spotPickerVisible, setSpotPickerVisible] = useState(false);
  const [occupancyUpdatedAt, setOccupancyUpdatedAt] = useState(null);
  const [isRefreshingOccupancy, setIsRefreshingOccupancy] = useState(false);

  const garageDetails = useMemo(
    () => enrichGarageWithDefaults(garage),
    [garage]
  );

  useEffect(() => {
    setSelectedLevelId(garageDetails?.levels?.[0]?.id || null);
  }, [garageDetails]);

  const selectedLevel = useMemo(() => {
    if (!garageDetails?.levels?.length) return null;
    return (
      garageDetails.levels.find((level) => level.id === selectedLevelId) ||
      garageDetails.levels[0]
    );
  }, [garageDetails, selectedLevelId]);

  const distanceFromPhone =
    garageDetails && userLocation
      ? `${getDistanceMiles(userLocation, garageDetails).toFixed(1)} mi`
      : 'Unavailable';

  const distanceMiles =
    garageDetails && userLocation
      ? getDistanceMiles(userLocation, garageDetails)
      : null;

  const refreshOccupancy = async () => {
    if (!garageDetails?.id) {
      return;
    }

    setIsRefreshingOccupancy(true);

    try {
      const response = await getLiveFramePredictions({
        lotId: garageDetails.id,
        levelId: selectedLevel?.id,
      });

      const spotsOpen =
        response?.empty ??
        response?.spots_open ??
        garageDetails.spotsOpen;

      if (spotsOpen != null) {
        onAvailabilityChange?.(garageDetails.id, spotsOpen);
      }

      setOccupancyUpdatedAt(Date.now());
    } catch {
      // Keep the last known occupancy when live refresh is unavailable.
    } finally {
      setIsRefreshingOccupancy(false);
    }
  };

  useEffect(() => {
    if (!visible || !garageDetails?.id) {
      return;
    }

    refreshOccupancy();
  }, [visible, garageDetails?.id, selectedLevel?.id]);

  const handleCheckSpots = () => {
    setSpotPickerVisible(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>More info</Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                activeOpacity={0.85}
                onPress={() => garageDetails && onToggleFavorite?.(garageDetails)}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isSaved ? '#ef4444' : '#111'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <InfoRow label="Name" value={garageDetails?.name} />
              <InfoRow label="Location" value={garageDetails?.address} />
              <InfoRow
                label="Review Rating"
                value={garageDetails ? `${garageDetails.rating}` : '-'}
              />
              <InfoRow label="Distance from phone" value={distanceFromPhone} />
              <InfoRow
                label="Drive time"
                value={
                  distanceMiles != null
                    ? formatDriveEta(distanceMiles)
                    : 'Unavailable'
                }
              />
              <InfoRow label="Rate/hr" value={garageDetails?.ratePerHour} />
              <InfoRow
                label="Spots open"
                value={
                  garageDetails?.spotsOpen == null
                    ? 'Unavailable'
                    : `${garageDetails.spotsOpen}`
                }
              />
              <InfoRow
                label="Live occupancy"
                value={
                  isRefreshingOccupancy
                    ? 'Refreshing...'
                    : formatUpdatedAgo(occupancyUpdatedAt)
                }
              />
              <InfoRow
                label="Schedule"
                value={garageDetails?.schedule || 'Unavailable'}
              />
            </View>

            {!!garageDetails?.details && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About this garage</Text>
                <Text style={styles.sectionBody}>{garageDetails.details}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => garageDetails && onDirections(garageDetails)}
              >
                <Text style={styles.primaryButtonText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={handleCheckSpots}
              >
                <Text style={styles.secondaryButtonText}>View spot map</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.secondaryWideButton}
              activeOpacity={0.85}
              onPress={() => onGarageLotPage?.()}
            >
              <Text style={styles.secondaryButtonText}>Garage lot page</Text>
            </TouchableOpacity>

            {!!garageDetails?.levels?.length && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Garage levels</Text>

                <View style={styles.levelTabs}>
                  {garageDetails.levels.map((level) => {
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

                <Text style={styles.levelOpenText}>
                  {selectedLevel?.openSpots ?? garageDetails?.spotsOpen ?? 0}{' '}
                  open spots on {selectedLevel?.name || 'this level'}
                </Text>
              </View>
            )}

            {!!garage?.peakTimes?.length && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Peak time graph</Text>

                <View style={styles.chartRow}>
                  {garageDetails.peakTimes.map((item) => (
                    <View key={item.label} style={styles.chartItem}>
                      <View style={styles.chartTrack}>
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: `${item.value}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartValue}>{item.value}%</Text>
                      <Text style={styles.chartLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <GarageSpotPickerModal
        visible={spotPickerVisible}
        garage={garageDetails}
        onClose={() => setSpotPickerVisible(false)}
        onAvailabilityChange={onAvailabilityChange}
      />
    </Modal>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    ...shadow.card,
  },

  modalContent: {
    padding: 20,
    paddingBottom: 32,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },

  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  infoValue: {
    fontSize: 15,
    color: '#111',
    fontWeight: '600',
    lineHeight: 21,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },

  sectionBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryWideButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  secondaryButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },

  levelTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  levelTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
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

  levelOpenText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  layoutSpot: {
    width: '31%',
    minHeight: 56,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  layoutSpotOpen: {
    backgroundColor: '#dff6e4',
  },

  layoutSpotOccupied: {
    backgroundColor: '#1f2937',
  },

  layoutSpotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532d',
  },

  layoutSpotTextLight: {
    color: '#fff',
  },

  legendRow: {
    flexDirection: 'row',
    marginTop: 4,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },

  legendText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },

  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  chartItem: {
    alignItems: 'center',
    width: '18%',
  },

  chartTrack: {
    width: 24,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#eceff3',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },

  chartBar: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 12,
  },

  chartValue: {
    fontSize: 11,
    color: '#111',
    fontWeight: '700',
    marginBottom: 4,
  },

  chartLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },

  closeButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  closeButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
});