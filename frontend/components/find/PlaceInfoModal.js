import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { radius, shadow, colors } from '../../styles/global';
import { getDistanceMiles } from '../../utils/findUtils';

export default function PlaceInfoModal({
  visible,
  place,
  userLocation,
  onClose,
  onDirections,
}) {
  const distanceFromPhone =
    place && userLocation
      ? `${getDistanceMiles(userLocation, place).toFixed(1)} mi away`
      : null;

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
            <Text style={styles.category}>{place?.category || 'Place'}</Text>
            <Text style={styles.title}>{place?.name || 'Place'}</Text>
            {!!place?.address && (
              <Text style={styles.address}>{place.address}</Text>
            )}
            {!!distanceFromPhone && (
              <Text style={styles.distance}>{distanceFromPhone}</Text>
            )}

            <View style={styles.infoCard}>
              <InfoRow label="Type" value={place?.category || 'Place'} />
              <InfoRow label="Address" value={place?.address || 'Unavailable'} />
              {!!place?.phone && (
                <InfoRow label="Phone" value={place.phone} />
              )}
              {!!place?.hours && (
                <InfoRow label="Hours" value={place.hours} />
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => place && onDirections(place)}
              >
                <Text style={styles.primaryButtonText}>Go</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadow.card,
  },

  modalContent: {
    padding: 20,
    paddingBottom: 32,
  },

  category: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  address: {
    fontSize: 15,
    color: '#444',
    lineHeight: 21,
    marginBottom: 6,
  },

  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 14,
    marginBottom: 16,
  },

  infoRow: {
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    color: '#111',
    lineHeight: 21,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
});
