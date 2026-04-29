import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { radius, shadow } from '../../styles/global';
import { DRAWER_HEIGHT } from '../../constants/findDrawer';
import { getDistanceMiles } from '../../utils/findUtils';

export default function FindDrawer({
  tabBarHeight,
  translateY,
  panHandlers,
  query,
  onChangeQuery,
  onSubmitSearch,
  isSearching,
  onFocusSearch,
  selectedGarage,
  referencePoint,
  onGo,
  onMoreInfo,
  garages,
  selectedSpotId,
  onSelectGarage,
}) {
  return (
    <Animated.View
      style={[
        styles.drawer,
        {
          bottom: tabBarHeight - 2,
          height: DRAWER_HEIGHT,
          transform: [{ translateY }],
        },
      ]}
    >
      <View {...panHandlers} style={styles.drawerHeaderDragArea}>
        <View style={styles.drawerHandleArea}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search here"
            placeholderTextColor="#777"
            value={query}
            onChangeText={onChangeQuery}
            onFocus={onFocusSearch}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
          />
          {isSearching && <Text style={styles.searchingText}>Searching…</Text>}
        </View>
      </View>

      <View style={styles.expandedContent}>
        {selectedGarage && (
          <View style={styles.selectedGarageCard}>
            <Text style={styles.selectedGarageName}>{selectedGarage.name}</Text>
            <Text style={styles.selectedGarageAddress}>
              {selectedGarage.address}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>★ {selectedGarage.rating}</Text>
              </View>

              <View style={styles.statPill}>
                <Text style={styles.statLabel}>{selectedGarage.ratePerHour}</Text>
              </View>

              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  {selectedGarage.spotsOpen} open
                </Text>
              </View>

              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  {getDistanceMiles(referencePoint, selectedGarage).toFixed(1)} mi
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.goButton}
                activeOpacity={0.85}
                onPress={() => onGo(selectedGarage)}
              >
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreInfoButton}
                activeOpacity={0.85}
                onPress={() => onMoreInfo(selectedGarage)}
              >
                <Text style={styles.moreInfoText}>More info</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Top 5 nearby garages</Text>

          {garages.map((spot) => {
            const isSelected = selectedSpotId === spot.id;

            return (
              <TouchableOpacity
                key={spot.id}
                style={[styles.resultCard, isSelected && styles.resultCardSelected]}
                activeOpacity={0.85}
                onPress={() => onSelectGarage(spot)}
              >
                <View style={styles.resultTopRow}>
                  <View style={styles.resultTextBlock}>
                    <Text style={styles.resultName}>{spot.name}</Text>
                    <Text style={styles.resultAddress}>{spot.address}</Text>
                  </View>

                  <Text style={styles.resultDistance}>
                    {getDistanceMiles(referencePoint, spot).toFixed(1)} mi
                  </Text>
                </View>

                <View style={styles.resultStatsInline}>
                  <Text style={styles.resultMeta}>★ {spot.rating}</Text>
                  <Text style={styles.resultMeta}>{spot.ratePerHour}</Text>
                  <Text style={styles.resultMeta}>{spot.spotsOpen} open</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    ...shadow.card,
  },

  drawerHeaderDragArea: {
    paddingBottom: 6,
  },

  drawerHandleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },

  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
  },

  searchWrap: {
    marginHorizontal: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  searchInput: {
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },

  searchingText: {
    position: 'absolute',
    right: 14,
    top: 17,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  expandedContent: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 20,
  },

  selectedGarageCard: {
    marginHorizontal: 14,
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  selectedGarageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },

  selectedGarageAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },

  statPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 12,
    color: '#111',
    fontWeight: '600',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  goButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  moreInfoButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreInfoText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },

  resultsList: {
    flex: 1,
    paddingHorizontal: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },

  resultCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  resultCardSelected: {
    backgroundColor: '#eceff3',
  },

  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  resultTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  resultAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  resultDistance: {
    fontSize: 12,
    color: '#444',
    fontWeight: '700',
  },

  resultStatsInline: {
    flexDirection: 'row',
    marginTop: 10,
  },

  resultMeta: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
    marginRight: 12,
  },
});