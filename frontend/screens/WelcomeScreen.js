import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function WelcomeScreen( {onSignIn, onRegister}) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.topRow}>
          <View style={styles.topItem}>
            <Text style={styles.label}>Region</Text>
            <Text style={styles.value}>USA</Text>
          </View>

          <View style={styles.topItem}>
            <Text style={styles.label}>Language</Text>
            <Text style={styles.value}>English</Text>
          </View>
        </View>
      </View>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        <Text style={styles.title}>IntelliPark</Text>

        <Image
          source={require('../assets/car.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={onSignIn}>
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onRegister}>
            <Text style={styles.secondaryText}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },

  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  topItem: {
    minWidth: 90,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },

  middleSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 20,
  },
  image: {
    width: '90%',
    height: 260,
  },

  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '60%',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '60%',
  },
  secondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});