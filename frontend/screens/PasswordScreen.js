import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { globalStyles, spacing } from '../styles/global';

export default function PasswordScreen({ identifier, onBack, onSignIn }) {
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const showFloatingLabel = isFocused || password.length > 0;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
          <Text style={globalStyles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={require('../assets/parking.png')}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={[globalStyles.title, styles.title]}>
            Enter your password
          </Text>

          <Text style={styles.identifier}>{identifier}</Text>

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              isFocused && globalStyles.inputWrapperFocused,
            ]}
          >
            {showFloatingLabel && (
              <Text style={globalStyles.floatingLabel}>Password</Text>
            )}

            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                showFloatingLabel && styles.inputWithLabel,
              ]}
              placeholder={showFloatingLabel ? '' : 'Password'}
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          <TouchableOpacity
            style={[globalStyles.buttonPrimary, styles.button]}
            onPress={onSignIn}
          >
            <Text style={globalStyles.buttonTextPrimary}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.linkRow}>
            Don’t remember your password?{' '}
            <Text
              style={styles.resetLink}
              onPress={() => console.log('Reset pressed')}
            >
              Reset it
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.screen,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
  },

  image: {
    width: '85%',
    height: 200,
    marginBottom: 18,
  },

  title: {
    marginBottom: 16,
    textAlign: 'center',
  },

  identifier: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },

  inputWrapper: {
    width: '85%',
    height: 64,
    marginBottom: 20,
  },

  input: {
    width: '100%',
  },

  inputWithLabel: {
    marginTop: 14,
  },

  button: {
    width: '85%',
    marginBottom: 16,
  },

  linkRow: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000',
  },

  resetLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});