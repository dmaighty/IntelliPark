import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { radius, colors } from '../../styles/global';
import { buildTheaterLayout } from '../../utils/garageSpotMap';

export default function GarageSpotMap({
  spots = [],
  loading = false,
  error = '',
  liveSource = false,
  selectedSpotId = null,
  onSelectSpot,
  onRefresh,
}) {
  const { rows } = buildTheaterLayout(spots);
  const openCount = spots.filter((spot) => !spot.occupied).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Pick a spot</Text>
          <Text style={styles.subtitle}>
            {liveSource
              ? 'Live from garage camera'
              : 'Estimated layout'}
            {' · '}
            {openCount} open
          </Text>
        </View>

        {typeof onRefresh === 'function' ? (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.refreshText}>
              {loading ? '…' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.entranceBar}>
        <Text style={styles.entranceText}>Entrance</Text>
      </View>

      {loading && spots.length === 0 ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator color="#111" />
          <Text style={styles.loadingText}>Loading live spots…</Text>
        </View>
      ) : null}

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading || spots.length > 0 ? (
        <View style={styles.auditorium}>
          {rows.map((row) => (
            <View key={row.id} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>

              <View style={styles.seatRow}>
                {row.seats.map((seat, index) => {
                  if (!seat) {
                    return (
                      <View
                        key={`${row.id}-gap-${index}`}
                        style={styles.seatGap}
                      />
                    );
                  }

                  const isSelected = selectedSpotId === seat.id;
                  const isOpen = !seat.occupied;

                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[
                        styles.seat,
                        isOpen ? styles.seatOpen : styles.seatOccupied,
                        isSelected && styles.seatSelected,
                      ]}
                      activeOpacity={isOpen ? 0.85 : 1}
                      disabled={!isOpen}
                      onPress={() => onSelectSpot?.(seat)}
                    >
                      <Text
                        style={[
                          styles.seatText,
                          !isOpen && styles.seatTextOccupied,
                        ]}
                      >
                        {seat.seatLabel || seat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.frontBar}>
        <Text style={styles.frontText}>Front / Exit</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.seatOpen]} />
          <Text style={styles.legendText}>Open</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.seatOccupied]} />
          <Text style={styles.legendText}>Occupied</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.seatSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
  },

  refreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007aff',
  },

  entranceBar: {
    alignSelf: 'center',
    width: '72%',
    paddingVertical: 8,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: '#dfe3ea',
    alignItems: 'center',
    marginBottom: 14,
  },

  entranceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.4,
  },

  auditorium: {
    paddingHorizontal: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  rowLabel: {
    width: 18,
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },

  seatRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  seatGap: {
    width: 42,
    height: 42,
  },

  seat: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  seatOpen: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },

  seatOccupied: {
    backgroundColor: '#1f2937',
    borderColor: '#111827',
    opacity: 0.88,
  },

  seatSelected: {
    borderColor: '#007aff',
    backgroundColor: '#dbeafe',
  },

  seatText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14532d',
  },

  seatTextOccupied: {
    color: '#f9fafb',
  },

  frontBar: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: radius.medium,
    backgroundColor: '#111',
    alignItems: 'center',
  },

  frontText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1.5,
  },

  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },

  centerBlock: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },

  errorBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },

  errorText: {
    fontSize: 13,
    color: '#856404',
  },
});
