import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { globalStyles, spacing } from '../styles/global';

export default function WelcomeScreen({ onSignIn, onRegister }) {
  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <View style={styles.topSection}>
        <View style={styles.topRow}>
          <View style={styles.topItem}>
            <Text style={[globalStyles.label, styles.label]}>Region</Text>
            <Text style={styles.value}>USA</Text>
          </View>

          <View style={styles.topItem}>
            <Text style={[globalStyles.label, styles.label]}>Language</Text>
            <Text style={styles.value}>English</Text>
          </View>
        </View>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.title}>IntelliPark</Text>

        <Image
          source={require('../assets/car.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, styles.button]}
          onPress={onSignIn}
        >
          <Text style={globalStyles.buttonTextPrimary}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.buttonSecondary, styles.button]}
          onPress={onRegister}
        >
          <Text style={globalStyles.buttonTextSecondary}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screen,
  },

  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topRow: {
    flexDirection: 'row',
    width: '80%',
  },

  topItem: {
    flex: 1,
    alignItems: 'center',
  },

  label: {
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },

  middleSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -15,
  },

  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
  },

  image: {
    width: '100%',
    height: 280,
  },

  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 12,
  },

  button: {
    width: '60%',
  },
});