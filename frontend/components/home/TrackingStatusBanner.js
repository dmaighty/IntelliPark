import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TrackingStatusBanner({ alert }) {
  if (!alert?.message) {
    return null;
  }

  const iconName =
    alert.type === 'location_denied'
      ? 'location-outline'
      : 'pause-circle-outline';

  return (
    <View style={styles.banner}>
      <Ionicons name={iconName} size={16} color="#92400e" />
      <Text style={styles.text}>{alert.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },

  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#92400e',
  },
});
