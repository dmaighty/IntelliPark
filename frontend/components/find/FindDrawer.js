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
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, colors } from '../../styles/global';
import { DRAWER_HEIGHT } from '../../constants/findDrawer';
import { getDistanceMiles } from '../../utils/findUtils';
import {
  getCarDisplayName,
  getCarStatusLabel,
} from '../../utils/carUtils';

const openSpotsText = (value) =>
  value == null ? 'Open: unavailable' : `${value} open`;

const SAVED_PLACE_ICONS = {
  home: 'home-outline',
  work: 'briefcase-outline',
  school: 'school-outline',
};

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

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
  selectedPlace,
  referencePoint,
  onGo,
  onMoreInfo,
  onMorePlaceInfo,
  garages,
  selectedSpotId,
  onSelectGarage,
  recentlyParkedCar,
  onSelectCar,
  savedPlaces = [],
  hasSavedPlaces = false,
  onAddSavedPlaces,
  onSelectSavedPlace,
  searchResults = [],
  onSelectSearchResult,
  recents = [],
  onSelectRecent,
}) {
  const isSearchingMode = query.trim().length >= 3;

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
          <Ionicons
            name="search"
            size={18}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#777"
            value={query}
            onChangeText={onChangeQuery}
            onFocus={onFocusSearch}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
          />
          {isSearching && (
            <Text style={styles.searchingText}>Searching…</Text>
          )}
        </View>
      </View>

      <View style={styles.expandedContent}>
        {selectedPlace && !isSearchingMode ? (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedCategory}>
              {selectedPlace.category || 'Place'}
            </Text>
            <Text style={styles.selectedName}>{selectedPlace.name}</Text>
            <Text style={styles.selectedAddress}>{selectedPlace.address}</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.goButton}
                activeOpacity={0.85}
                onPress={() => onGo(selectedPlace)}
              >
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreInfoButton}
                activeOpacity={0.85}
                onPress={() => onMorePlaceInfo?.(selectedPlace)}
              >
                <Text style={styles.moreInfoText}>More info</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {selectedGarage && !selectedPlace && !isSearchingMode ? (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedName}>{selectedGarage.name}</Text>
            <Text style={styles.selectedAddress}>
              {selectedGarage.address}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  ★ {selectedGarage.rating}
                </Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  {selectedGarage.ratePerHour}
                </Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  {openSpotsText(selectedGarage.spotsOpen)}
                </Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>
                  {getDistanceMiles(referencePoint, selectedGarage).toFixed(1)}{' '}
                  mi
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
        ) : null}

        <ScrollView
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSearchingMode ? (
            <>
              <SectionTitle>Search results</SectionTitle>
              {searchResults.length === 0 && !isSearching ? (
                <Text style={styles.emptyResultsText}>
                  No places found for that search.
                </Text>
              ) : null}
              {searchResults.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.resultCard}
                  activeOpacity={0.85}
                  onPress={() => onSelectSearchResult?.(place)}
                >
                  <View style={styles.resultTopRow}>
                    <View style={styles.placeIconWrap}>
                      <Ionicons name="location-outline" size={18} color="#111" />
                    </View>
                    <View style={styles.resultTextBlock}>
                      <Text style={styles.resultName}>{place.name}</Text>
                      <Text style={styles.resultMetaText}>
                        {place.category}
                      </Text>
                      <Text style={styles.resultAddress}>{place.address}</Text>
                    </View>
                    <Text style={styles.resultDistance}>
                      {referencePoint
                        ? `${getDistanceMiles(referencePoint, place).toFixed(1)} mi`
                        : '--'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {recentlyParkedCar ? (
                <>
                  <SectionTitle>Recently parked car</SectionTitle>
                  <TouchableOpacity
                    style={styles.resultCard}
                    activeOpacity={0.85}
                    onPress={() => onSelectCar?.(recentlyParkedCar)}
                  >
                    <View style={styles.resultTopRow}>
                      <View style={styles.placeIconWrap}>
                        <Ionicons
                          name="car-sport-outline"
                          size={18}
                          color="#111"
                        />
                      </View>
                      <View style={styles.resultTextBlock}>
                        <Text style={styles.resultName}>
                          {getCarDisplayName(recentlyParkedCar)}
                        </Text>
                        <Text style={styles.resultAddress}>
                          {getCarStatusLabel(recentlyParkedCar)}
                        </Text>
                      </View>
                      <Text style={styles.resultDistance}>
                        {referencePoint && recentlyParkedCar.parkedLocation
                          ? `${getDistanceMiles(
                              referencePoint,
                              recentlyParkedCar.parkedLocation
                            ).toFixed(1)} mi`
                          : '--'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : null}

              {hasSavedPlaces ? (
                <>
                  <SectionTitle>Pinned locations</SectionTitle>
                  <View style={styles.savedRow}>
                    {savedPlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={styles.savedChip}
                        activeOpacity={0.85}
                        onPress={() => onSelectSavedPlace?.(place)}
                      >
                        <Ionicons
                          name={
                            SAVED_PLACE_ICONS[place.id] || 'bookmark-outline'
                          }
                          size={20}
                          color="#111"
                        />
                        <Text style={styles.savedChipLabel}>{place.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <SectionTitle>Pinned locations</SectionTitle>
                  <TouchableOpacity
                    style={styles.savedPromptCard}
                    activeOpacity={0.85}
                    onPress={() => onAddSavedPlaces?.()}
                  >
                    <View style={styles.savedPromptIconWrap}>
                      <Ionicons
                        name="home-outline"
                        size={22}
                        color="#111"
                      />
                    </View>
                    <View style={styles.savedPromptTextBlock}>
                      <Text style={styles.savedPromptTitle}>
                        Add pinned locations
                      </Text>
                      <Text style={styles.savedPromptBody}>
                        Save Home, Work, and School in Profile for quick
                        navigation from Find.
                      </Text>
                    </View>
                    <Text style={styles.savedPromptAction}>Add</Text>
                  </TouchableOpacity>
                </>
              )}

              <SectionTitle>5 closest garages</SectionTitle>
              {garages.length === 0 ? (
                <Text style={styles.emptyResultsText}>
                  No garages found nearby.
                </Text>
              ) : null}
              {garages.map((spot) => {
                const isSelected = selectedSpotId === spot.id;

                return (
                  <TouchableOpacity
                    key={spot.id}
                    style={[
                      styles.resultCard,
                      isSelected && styles.resultCardSelected,
                    ]}
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
                      <Text style={styles.resultMeta}>
                        {openSpotsText(spot.spotsOpen)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {recents.length > 0 ? (
                <>
                  <SectionTitle>Recents</SectionTitle>
                  {recents.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultCard}
                      activeOpacity={0.85}
                      onPress={() => onSelectRecent?.(item)}
                    >
                      <View style={styles.resultTopRow}>
                        <View style={styles.placeIconWrap}>
                          <Ionicons name="time-outline" size={18} color="#111" />
                        </View>
                        <View style={styles.resultTextBlock}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultAddress}>
                            {item.address || item.category || 'Recent place'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : null}
            </>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },

  searchingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },

  expandedContent: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 20,
  },

  selectedCard: {
    marginHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  selectedCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },

  selectedAddress: {
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
    marginTop: 4,
  },

  emptyResultsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },

  savedRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  savedChip: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  savedChipLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  savedPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  savedPromptIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  savedPromptTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  savedPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  savedPromptBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
  },

  savedPromptAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007aff',
  },

  resultCard: {
    backgroundColor: colors.surface,
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

  placeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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

  resultMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
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
