import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getDurationText = (parkedAt, now) => {
  if (!parkedAt) return '';

  const start = new Date(parkedAt).getTime();

  if (!Number.isFinite(start)) {
    return '';
  }

  const elapsedMilliseconds = Math.max(0, now - start);
  const totalMinutes = Math.floor(elapsedMilliseconds / 60000);

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes < 1) {
    return 'less than a minute';
  }

  return `${minutes}m`;
};

export default function CarStatusRow({
  status = 'unknown',
  parkedAt = null,
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

  let label = 'Status unavailable';

  if (status === 'driving') {
    label = 'Driving';
  }

  if (status === 'parking') {
    label = 'Parking detected';
  }

  if (status === 'parked') {
    const duration = getDurationText(parkedAt, now);
    label = duration ? `Parked for ${duration}` : 'Parked';
  }

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