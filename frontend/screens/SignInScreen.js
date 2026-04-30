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

export default function SignInScreen({ onBack, onContinue, onRegister, onDevBypass }) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');

  const showFloatingLabel = isFocused || input.length > 0;

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length === 0) return '';
    if (digits.length < 4) return digits;
    if (digits.length < 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const isEmailValid = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const isMobileValid = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validateInput = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      setError('Email or mobile number is required');
      return false;
    }

    if (!isEmailValid(trimmed) && !isMobileValid(trimmed)) {
      setError('Enter a valid email or mobile number');
      return false;
    }

    setError('');
    return true;
  };

  const handleInputChange = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setInput(value);
      if (error) setError('');
      return;
    }

    const hasLetters = /[a-zA-Z@]/.test(value);

    if (hasLetters) {
      setInput(value);
    } else {
      setInput(formatPhoneNumber(value));
    }

    if (error) setError('');
  };

  const handleContinue = () => {
    if (!validateInput()) return;
    onContinue?.(input.trim());
  };

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

          <Text style={[globalStyles.title, styles.title]}>Welcome back</Text>

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              isFocused && globalStyles.inputWrapperFocused,
              error && globalStyles.inputWrapperError,
            ]}
          >
            {showFloatingLabel && (
              <Text style={globalStyles.floatingLabel}>
                Email or mobile number
              </Text>
            )}

            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                showFloatingLabel && styles.inputWithLabel,
              ]}
              placeholder={showFloatingLabel ? '' : 'Email or mobile number'}
              placeholderTextColor="#888"
              value={input}
              onChangeText={handleInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {error ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[globalStyles.buttonPrimary, styles.button]}
            onPress={handleContinue}
          >
            <Text style={globalStyles.buttonTextPrimary}>Continue</Text>
          </TouchableOpacity>

          <Text style={styles.linkRow}>
            Don’t have an account?{' '}
            <Text style={styles.registerLink} onPress={onRegister}>
              Register
            </Text>
          </Text>

          {typeof __DEV__ !== 'undefined' && __DEV__ && onDevBypass ? (
            <TouchableOpacity
              style={styles.devBypass}
              onPress={onDevBypass}
              accessibilityLabel="Dev bypass sign-in"
            >
              <Text style={styles.devBypassText}>Continue without sign-in (dev)</Text>
            </TouchableOpacity>
          ) : null}
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
    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  inputWrapper: {
    width: '85%',
    height: 64,
    marginBottom: 8,
  },

  input: {
    width: '100%',
  },

  inputWithLabel: {
    marginTop: 14,
  },

  errorText: {
    width: '85%',
    marginBottom: 12,
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

  registerLink: {
    color: '#007AFF',
    fontWeight: '500',
  },

  devBypass: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  devBypassText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});