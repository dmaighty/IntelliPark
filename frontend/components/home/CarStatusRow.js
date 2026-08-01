import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCarStatusLabel } from '../../utils/carUtils';

export default function CarStatusRow({
  status = 'unknown',
  parkedAt = null,
  speedMph = null,
  parkedLotName = null,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'parked' || !parkedAt) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [status, parkedAt]);

  const label = getCarStatusLabel(
    { status, parkedAt, lastKnownSpeedMph: speedMph, parkedLotName },
    now
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.statusDot,
          status === 'driving' && styles.drivingDot,
          status === 'parking' && styles.parkingDot,
          status === 'parked' && styles.parkedDot,
        ]}
      />

      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
    backgroundColor: '#8e8e93',
  },

  drivingDot: {
    backgroundColor: '#34c759',
  },

  parkingDot: {
    backgroundColor: '#ff9500',
  },

  parkedDot: {
    backgroundColor: '#007aff',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
});
