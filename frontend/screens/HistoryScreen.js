import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import {
  filterHistoryItems,
  getHistoryCarOptions,
  getHistoryLocationDisplay,
} from '../utils/parkingHistoryUtils';

export default function HistoryScreen({
  history = [],
  cars = [],
  tabBarHeight = 100,
}) {
  const [query, setQuery] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('all');
  const [carFilterOpen, setCarFilterOpen] = useState(false);

  const carOptions = useMemo(
    () => getHistoryCarOptions(history, cars),
    [history, cars]
  );

  const selectedCarLabel = useMemo(() => {
    const match = carOptions.find((option) => option.id === selectedCarId);
    return match?.label || 'All cars';
  }, [carOptions, selectedCarId]);

  const filteredHistory = useMemo(
    () =>
      filterHistoryItems(history, {
        query,
        carId: selectedCarId,
      }),
    [history, query, selectedCarId]
  );

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Parking History</Text>
        <Text style={styles.subtitle}>
          Search past sessions by car, garage, address, or date.
        </Text>

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search history"
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {carOptions.length > 1 ? (
            <TouchableOpacity
              style={styles.filterButton}
              activeOpacity={0.85}
              onPress={() => setCarFilterOpen(true)}
            >
              <Ionicons name="car-outline" size={14} color="#444" />
              <Text style={styles.filterButtonText} numberOfLines={1}>
                {selectedCarId === 'all' ? 'All' : selectedCarLabel}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Modal
          visible={carFilterOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCarFilterOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCarFilterOpen(false)}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <Text style={styles.modalTitle}>Filter by car</Text>

              <ScrollView
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {carOptions.map((option) => {
                  const isSelected = selectedCarId === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.modalOption,
                        isSelected && styles.modalOptionSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedCarId(option.id);
                        setCarFilterOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color="#111" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No parking history yet</Text>
              <Text style={styles.emptyText}>
                Your past parking sessions will show here.
              </Text>
            </View>
          ) : filteredHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyText}>
                Try a different search or car filter.
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => {
              const location = getHistoryLocationDisplay(item);

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.carName} numberOfLines={1}>
                        {item.carName}
                      </Text>
                      {!!item.licensePlate && (
                        <Text style={styles.plate}>{item.licensePlate}</Text>
                      )}
                    </View>

                    <View style={styles.cardMetaBlock}>
                      {item.isActive ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      ) : null}
                      <Text style={styles.duration}>{item.duration}</Text>
                    </View>
                  </View>

                  <Text style={styles.locationLabel} numberOfLines={1}>
                    {location.label}
                  </Text>
                  {!!location.detail && (
                    <Text style={styles.locationDetail} numberOfLines={2}>
                      {location.detail}
                    </Text>
                  )}

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.timeText} numberOfLines={1}>
                      {item.date} · {item.startTime}
                      {item.endTime ? ` – ${item.endTime}` : ''}
                    </Text>
                    {item.rate ? (
                      <Text style={styles.rateText}>{item.rate}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginTop: 10,
  },

  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  searchWrap: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  searchInput: {
    fontSize: 15,
    color: '#111',
    padding: 0,
    margin: 0,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    maxWidth: 118,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },

  filterButtonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: spacing.screen,
    paddingBottom: 28,
    maxHeight: '55%',
  },

  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  modalList: {
    flexGrow: 0,
  },

  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },

  modalOptionSelected: {
    backgroundColor: '#f7f7f7',
    marginHorizontal: -spacing.screen,
    paddingHorizontal: spacing.screen,
  },

  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingRight: 12,
  },

  modalOptionTextSelected: {
    fontWeight: '700',
    color: '#111',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
    alignItems: 'center',
    ...shadow.soft,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    ...shadow.soft,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  cardTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },

  cardMetaBlock: {
    alignItems: 'flex-end',
  },

  carName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  plate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },

  activeBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },

  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },

  duration: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  locationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },

  locationDetail: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  timeText: {
    flex: 1,
    fontSize: 11,
    color: '#777',
    fontWeight: '600',
  },

  rateText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '700',
  },
});
