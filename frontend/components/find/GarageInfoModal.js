import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { radius, shadow } from '../../styles/global';
import { getDistanceMiles } from '../../utils/findUtils';

const { height } = Dimensions.get('window');

export default function GarageInfoModal({
  visible,
  garage,
  userLocation,
  onClose,
  onDirections,
  onGarageLotPage,
}) {
  const [selectedLevelId, setSelectedLevelId] = useState(null);

  useEffect(() => {
    setSelectedLevelId(garage?.levels?.[0]?.id || null);
  }, [garage]);

  const selectedLevel = useMemo(() => {
    if (!garage?.levels?.length) return null;
    return (
      garage.levels.find((level) => level.id === selectedLevelId) ||
      garage.levels[0]
    );
  }, [garage, selectedLevelId]);

  const distanceFromPhone =
    garage && userLocation
      ? `${getDistanceMiles(userLocation, garage).toFixed(1)} mi`
      : 'Unavailable';

  const handleCheckSpots = () => {
    Alert.alert(
      'Check spots',
      selectedLevel
        ? `${selectedLevel.openSpots} spots open on ${selectedLevel.name}.`
        : `${garage?.spotsOpen ?? 0} total spots open.`
    );
  };

  const handleGarageLotPage = () => {
    Alert.alert(
      'Garage lot page',
      'Connect this button to your real garage details page or API later.'
    );
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
            <Text style={styles.modalTitle}>More info</Text>

            <View style={styles.infoCard}>
              <InfoRow label="Name" value={garage?.name} />
              <InfoRow label="Location" value={garage?.address} />
              <InfoRow
                label="Review Rating"
                value={garage ? `${garage.rating}` : '-'}
              />
              <InfoRow label="Distance from phone" value={distanceFromPhone} />
              <InfoRow label="Rate/hr" value={garage?.ratePerHour} />
              <InfoRow
                label="Spots open"
                value={garage ? `${garage.spotsOpen}` : '-'}
              />
              <InfoRow label="Schedule" value={garage?.schedule || 'Unavailable'} />
            </View>

            {!!garage?.details && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Garage lot page</Text>
                <Text style={styles.sectionBody}>{garage.details}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => garage && onDirections(garage)}
              >
                <Text style={styles.primaryButtonText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={handleCheckSpots}
              >
                <Text style={styles.secondaryButtonText}>Check spots</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.secondaryWideButton}
              activeOpacity={0.85}
              onPress={() => onGarageLotPage?.()}
            >
              <Text style={styles.secondaryButtonText}>Garage lot page</Text>
            </TouchableOpacity>

            {!!garage?.levels?.length && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Change level</Text>

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

                <Text style={styles.levelOpenText}>
                  {selectedLevel?.openSpots ?? 0} open spots
                </Text>
              </View>
            )}

            {!!selectedLevel?.layout?.length && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Top view map layout w live occupied/open spots
                </Text>

                <View style={styles.layoutGrid}>
                  {selectedLevel.layout.map((spot, index) => {
                    const isOpen = spot === 'open';

                    return (
                      <View
                        key={`${selectedLevel.id}-${index}`}
                        style={[
                          styles.layoutSpot,
                          isOpen ? styles.layoutSpotOpen : styles.layoutSpotOccupied,
                        ]}
                      >
                        <Text
                          style={[
                            styles.layoutSpotText,
                            !isOpen && styles.layoutSpotTextLight,
                          ]}
                        >
                          {isOpen ? 'Open' : 'Full'}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.layoutSpotOpen]} />
                    <Text style={styles.legendText}>Open</Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.layoutSpotOccupied]} />
                    <Text style={styles.legendText}>Occupied</Text>
                  </View>
                </View>
              </View>
            )}

            {!!garage?.peakTimes?.length && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Peak time graph</Text>

                <View style={styles.chartRow}>
                  {garage.peakTimes.map((item) => (
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

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },

  infoCard: {
    backgroundColor: '#f8f8f8',
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
    backgroundColor: '#f8f8f8',
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