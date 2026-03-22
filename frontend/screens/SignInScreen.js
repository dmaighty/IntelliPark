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

export default function SignInScreen({ onBack, onContinue, onRegister }) {
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
    onContinue && onContinue(input.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
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

          <Text style={styles.title}>Welcome back</Text>

          <View
            style={[
              styles.inputWrapper,
              isFocused && styles.inputWrapperFocused,
              error && styles.inputWrapperError,
            ]}
          >
            {showFloatingLabel && (
              <Text style={styles.floatingLabel}>Email or mobile number</Text>
            )}

            <TextInput
              style={[
                styles.input,
                showFloatingLabel && styles.inputWithLabel,
              ]}
              placeholder={showFloatingLabel ? '' : 'Email or mobile number'}
              placeholderTextColor="#888"
              value={input}
              onChangeText={handleInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <Text style={styles.linkRow}>
            Don’t have an account?{' '}
            <Text style={styles.registerLink} onPress={onRegister}>
              Register
            </Text>
          </Text>
        </View>
      </ScrollView>
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
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  backArrow: {
    fontSize: 30,
    color: '#000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 30,
  },
  image: {
    width: '85%',
    height: 200,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000',
  },
  inputWrapper: {
    width: '85%',
    height: 64,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
    position: 'relative',
  },
  inputWrapperFocused: {
    borderColor: '#000',
  },
  inputWrapperError: {
    borderColor: '#d32f2f',
  },
  floatingLabel: {
    position: 'absolute',
    top: 8,
    left: 14,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },
  inputWithLabel: {
    marginTop: 14,
  },
  errorText: {
    width: '85%',
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '85%',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});