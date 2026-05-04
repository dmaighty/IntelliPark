import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { globalStyles, spacing, radius, shadow } from '../styles/global';

export default function HistoryScreen({
  history = [],
  tabBarHeight = 100,
}) {
  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Parking History</Text>
        <Text style={styles.subtitle}>
          View your past parked locations, time spent, and lot info.
        </Text>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No parking history yet</Text>
              <Text style={styles.emptyText}>
                Your past parking sessions will show here.
              </Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.carName}>{item.carName}</Text>
                    <Text style={styles.plate}>{item.licensePlate}</Text>
                  </View>

                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{item.date}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Lot Info</Text>
                  <Text style={styles.infoText}>{item.lotName}</Text>
                  <Text style={styles.infoSubtext}>{item.address}</Text>
                  <Text style={styles.infoSubtext}>
                    {item.level} • Spot {item.spot}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Start</Text>
                    <Text style={styles.detailValue}>{item.startTime}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>End</Text>
                    <Text style={styles.detailValue}>{item.endTime}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Time Spent</Text>
                    <Text style={styles.detailValue}>{item.duration}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>{item.rate}</Text>
                  </View>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{item.total}</Text>
                </View>
              </View>
            ))
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 10,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  emptyCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.large,
    padding: 20,
    alignItems: 'center',
    ...shadow.card,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.large,
    padding: 16,
    marginBottom: 14,
    ...shadow.card,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  carName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  plate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },

  dateBadge: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  dateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },

  section: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 6,
  },

  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  infoSubtext: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  detailBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },

  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
  },

  totalRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },

  totalValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
  },
});